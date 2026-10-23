const PollService = require('../services/pollService');
const { Poll } = require('../models');

class PollController {
  static async renderPollsList(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const category = req.query.category || 'All';
      const search = req.query.search || '';

      const { polls, totalCount, currentPage, totalPages } = await PollService.listPublicPolls({
        category,
        search,
        page,
        limit: 9
      });

      res.render('pages/polls/index', {
        title: 'Explore Community Polls - QuickPulse',
        polls,
        category,
        search,
        currentPage,
        totalPages,
        totalCount
      });
    } catch (err) {
      console.error('[LIST POLLS ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error Loading Polls',
        message: 'Could not load the poll directory.'
      });
    }
  }

  static renderCreatePoll(req, res) {
    res.render('pages/polls/create', {
      title: 'Create a New Poll - QuickPulse',
      formData: {},
      errors: []
    });
  }

  static async createPoll(req, res) {
    const { title, description, category, options, isMultipleChoice, isAnonymous, requireLogin, isPublic, expiresAt } = req.body;
    try {
      const poll = await PollService.createPoll(req.user.id, {
        title,
        description,
        category,
        options,
        isMultipleChoice: isMultipleChoice === 'true' || isMultipleChoice === 'on',
        isAnonymous: isAnonymous === 'true' || isAnonymous === 'on',
        requireLogin: requireLogin === 'true' || requireLogin === 'on',
        isPublic: isPublic === 'true' || isPublic === 'on',
        expiresAt: expiresAt || null
      });

      req.flash('success', 'Poll created and published successfully!');
      return res.redirect(`/polls/${poll.slug}`);
    } catch (err) {
      console.error('[CREATE POLL ERROR]:', err);
      return res.status(400).render('pages/polls/create', {
        title: 'Create a New Poll - QuickPulse',
        formData: req.body,
        errors: [err.message || 'Failed to create poll. Please check your inputs.']
      });
    }
  }

  static async renderPollVote(req, res) {
    try {
      const identifier = req.params.slugOrId;
      const poll = await PollService.getPollByIdOrSlug(identifier);

      if (!poll) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'The requested poll does not exist or has been removed.'
        });
      }

      // Check if user has already voted
      const userId = req.user ? req.user.id : null;
      const sessionId = req.sessionID;
      const ip = req.ip || req.connection.remoteAddress;

      const hasVoted = await PollService.hasUserVoted(poll.id, { userId, sessionId, ip });

      res.render('pages/polls/vote', {
        title: `${poll.title} - Vote on QuickPulse`,
        poll,
        hasVoted,
        errors: [],
        appUrl: process.env.APP_URL || `http://${req.headers.host}`
      });
    } catch (err) {
      console.error('[VIEW POLL ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error loading poll',
        message: 'Unable to retrieve poll details.'
      });
    }
  }

  static async submitPollVote(req, res) {
    const identifier = req.params.slugOrId;
    try {
      const poll = await PollService.getPollByIdOrSlug(identifier);
      if (!poll) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'This poll could not be located.'
        });
      }

      const userId = req.user ? req.user.id : null;
      const sessionId = req.sessionID;
      const ip = req.ip || req.connection.remoteAddress;

      const optionIds = req.body.options || req.body.option;

      if (!optionIds) {
        return res.status(400).render('pages/polls/vote', {
          title: `${poll.title} - Vote on QuickPulse`,
          poll,
          hasVoted: false,
          errors: ['Please select an option before voting.'],
          appUrl: process.env.APP_URL || `http://${req.headers.host}`
        });
      }

      await PollService.submitVote({
        pollId: poll.id,
        optionIds,
        userId,
        sessionId,
        ip
      });

      req.flash('success', 'Thank you! Your vote has been recorded.');
      return res.redirect(`/polls/${poll.slug}/results`);
    } catch (err) {
      console.error('[VOTE SUBMIT ERROR]:', err);
      const poll = await PollService.getPollByIdOrSlug(identifier);
      return res.status(400).render('pages/polls/vote', {
        title: poll ? `${poll.title} - Vote on QuickPulse` : 'Error',
        poll,
        hasVoted: false,
        errors: [err.message || 'Failed to submit your vote.'],
        appUrl: process.env.APP_URL || `http://${req.headers.host}`
      });
    }
  }

  static async renderPollResults(req, res) {
    try {
      const identifier = req.params.slugOrId;
      const poll = await PollService.getPollByIdOrSlug(identifier);

      if (!poll) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'The requested poll results are not available.'
        });
      }

      const results = await PollService.getPollResults(poll.id);

      res.render('pages/polls/results', {
        title: `Results: ${poll.title} - QuickPulse`,
        poll: results.poll,
        totalVotes: results.totalVotes,
        options: results.options,
        appUrl: process.env.APP_URL || `http://${req.headers.host}`
      });
    } catch (err) {
      console.error('[POLL RESULTS ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error Loading Results',
        message: 'Could not calculate poll results.'
      });
    }
  }

  static async renderEditPoll(req, res) {
    try {
      const identifier = req.params.slugOrId;
      const poll = await PollService.getPollByIdOrSlug(identifier);

      if (!poll) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'Poll not found.'
        });
      }

      const isAdmin = req.user && req.user.role === 'admin';
      if (poll.userId !== req.user.id && !isAdmin) {
        req.flash('error', 'Unauthorized access.');
        return res.redirect('/dashboard');
      }

      res.render('pages/polls/edit', {
        title: `Edit Poll: ${poll.title}`,
        poll,
        errors: []
      });
    } catch (err) {
      console.error('[EDIT POLL ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error',
        message: 'Could not load poll for editing.'
      });
    }
  }

  static async updatePoll(req, res) {
    const identifier = req.params.slugOrId;
    try {
      const poll = await PollService.getPollByIdOrSlug(identifier);
      if (!poll) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'Poll not found.'
        });
      }

      const isAdmin = req.user && req.user.role === 'admin';
      const { title, description, category, status, isPublic, expiresAt } = req.body;

      await PollService.updatePoll(poll.id, req.user.id, {
        title,
        description,
        category,
        status,
        isPublic: isPublic === 'true' || isPublic === 'on',
        expiresAt: expiresAt || null
      }, isAdmin);

      req.flash('success', 'Poll updated successfully.');
      return res.redirect(`/polls/${poll.slug}`);
    } catch (err) {
      console.error('[UPDATE POLL ERROR]:', err);
      req.flash('error', err.message || 'Failed to update poll.');
      return res.redirect(`/polls/${identifier}/edit`);
    }
  }

  static async deletePoll(req, res) {
    const pollId = req.params.id;
    try {
      const isAdmin = req.user && req.user.role === 'admin';
      await PollService.deletePoll(pollId, req.user.id, isAdmin);

      req.flash('success', 'Poll was deleted successfully.');
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('[DELETE POLL ERROR]:', err);
      req.flash('error', err.message || 'Failed to delete poll.');
      return res.redirect('/dashboard');
    }
  }
}

module.exports = PollController;
