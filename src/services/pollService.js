const { sequelize, Poll, PollOption, PollVote, PollVoteSelection, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

class PollService {
  static hashIp(ip) {
    if (!ip) return null;
    return crypto.createHash('sha256').update(ip + (process.env.SESSION_SECRET || 'salt')).digest('hex');
  }

  static generateSlug(title) {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }

  static async createPoll(userId, data) {
    const { title, description, category, options, isMultipleChoice, isAnonymous, requireLogin, isPublic, expiresAt } = data;

    if (!title || title.trim().length < 3) {
      throw new Error('Poll title must be at least 3 characters long.');
    }

    const filteredOptions = (options || [])
      .map(o => (typeof o === 'string' ? o.trim() : ''))
      .filter(o => o.length > 0);

    if (filteredOptions.length < 2) {
      throw new Error('A poll requires at least 2 distinct answer options.');
    }

    const slug = this.generateSlug(title);

    return await sequelize.transaction(async (t) => {
      const poll = await Poll.create({
        userId,
        title: title.trim(),
        description: description ? description.trim() : null,
        category: category || 'General',
        isMultipleChoice: Boolean(isMultipleChoice),
        isAnonymous: isAnonymous !== undefined ? Boolean(isAnonymous) : true,
        requireLogin: Boolean(requireLogin),
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
        status: 'published',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        slug
      }, { transaction: t });

      const optionRows = filteredOptions.map((optText, index) => ({
        pollId: poll.id,
        optionText: optText,
        orderIndex: index
      }));

      await PollOption.bulkCreate(optionRows, { transaction: t });

      return poll;
    });
  }

  static async getPollByIdOrSlug(identifier) {
    const isNumeric = /^\d+$/.test(identifier);
    const where = isNumeric ? { id: parseInt(identifier, 10) } : { slug: identifier };

    return await Poll.findOne({
      where,
      include: [
        { model: PollOption, as: 'options' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [[{ model: PollOption, as: 'options' }, 'orderIndex', 'ASC']]
    });
  }

  static async hasUserVoted(pollId, { userId, sessionId, ip }) {
    const orConditions = [];

    if (userId) {
      orConditions.push({ userId });
    }
    if (sessionId) {
      orConditions.push({ sessionId });
    }
    const ipHash = this.hashIp(ip);
    if (ipHash) {
      orConditions.push({ ipHash });
    }

    if (orConditions.length === 0) return false;

    const existing = await PollVote.findOne({
      where: {
        pollId,
        [Op.or]: orConditions
      }
    });

    return !!existing;
  }

  static async submitVote({ pollId, optionIds, userId, sessionId, ip }) {
    const poll = await Poll.findByPk(pollId, {
      include: [{ model: PollOption, as: 'options' }]
    });

    if (!poll) {
      throw new Error('Poll not found.');
    }

    if (poll.status !== 'published') {
      throw new Error('This poll is not accepting votes because it is not published.');
    }

    if (poll.isExpired) {
      throw new Error('This poll has closed and expired.');
    }

    if (poll.requireLogin && !userId) {
      throw new Error('You must be logged in to vote in this poll.');
    }

    // Duplicate vote check
    const alreadyVoted = await this.hasUserVoted(poll.id, { userId, sessionId, ip });
    if (alreadyVoted) {
      throw new Error('You have already submitted a vote for this poll.');
    }

    // Validate options
    const selected = Array.isArray(optionIds) ? optionIds.map(Number) : [Number(optionIds)];
    if (selected.length === 0 || selected.some(isNaN)) {
      throw new Error('Please select a valid option.');
    }

    if (!poll.isMultipleChoice && selected.length > 1) {
      throw new Error('Multiple selections are not permitted for this poll.');
    }

    const validOptionIds = new Set(poll.options.map(o => o.id));
    for (const id of selected) {
      if (!validOptionIds.has(id)) {
        throw new Error('Selected option does not belong to this poll.');
      }
    }

    const ipHash = this.hashIp(ip);

    return await sequelize.transaction(async (t) => {
      const vote = await PollVote.create({
        pollId: poll.id,
        userId: userId || null,
        sessionId: sessionId || null,
        ipHash: ipHash || null,
        votedAt: new Date()
      }, { transaction: t });

      const selections = selected.map(optionId => ({
        voteId: vote.id,
        pollOptionId: optionId
      }));

      await PollVoteSelection.bulkCreate(selections, { transaction: t });
      return vote;
    });
  }

  static async getPollResults(pollId) {
    const poll = await Poll.findByPk(pollId, {
      include: [
        { model: PollOption, as: 'options' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [[{ model: PollOption, as: 'options' }, 'orderIndex', 'ASC']]
    });

    if (!poll) {
      throw new Error('Poll not found.');
    }

    const totalVotesCount = await PollVote.count({ where: { pollId: poll.id } });

    // Aggregate counts per option
    const optionStats = await Promise.all(
      poll.options.map(async (option) => {
        const count = await PollVoteSelection.count({
          where: { pollOptionId: option.id }
        });
        const percentage = totalVotesCount > 0
          ? ((count / totalVotesCount) * 100).toFixed(1)
          : '0.0';
        return {
          id: option.id,
          optionText: option.optionText,
          orderIndex: option.orderIndex,
          votesCount: count,
          percentage: parseFloat(percentage)
        };
      })
    );

    return {
      poll,
      totalVotes: totalVotesCount,
      options: optionStats
    };
  }

  static async updatePoll(pollId, userId, updateData) {
    const poll = await Poll.findByPk(pollId, {
      include: [{ model: PollOption, as: 'options' }]
    });

    if (!poll) {
      throw new Error('Poll not found.');
    }

    if (poll.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to modify this poll.');
    }

    const { title, description, category, status, isPublic, expiresAt } = updateData;

    if (title) poll.title = title.trim();
    if (description !== undefined) poll.description = description.trim();
    if (category) poll.category = category;
    if (status) poll.status = status;
    if (isPublic !== undefined) poll.isPublic = Boolean(isPublic);
    if (expiresAt !== undefined) poll.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await poll.save();
    return poll;
  }

  static async deletePoll(pollId, userId) {
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      throw new Error('Poll not found.');
    }
    if (poll.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to delete this poll.');
    }
    await poll.destroy();
    return true;
  }

  static async listPublicPolls({ category, search, page = 1, limit = 9 }) {
    const where = {
      isPublic: true,
      status: { [Op.in]: ['published', 'closed'] }
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search && search.trim()) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Poll.findAndCountAll({
      where,
      include: [
        { model: PollOption, as: 'options' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: PollVote, as: 'votes', attributes: ['id'] }
      ],
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      polls: rows,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = PollService;
