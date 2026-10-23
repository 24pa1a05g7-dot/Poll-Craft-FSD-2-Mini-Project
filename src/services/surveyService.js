const {
  sequelize,
  Survey,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveyResponse,
  SurveyAnswer,
  SurveyAnswerSelection,
  User
} = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

class SurveyService {
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

  static async createSurvey(userId, data) {
    const { title, description, category, isPublic, requireLogin, allowAnonymous, expiresAt } = data;

    if (!title || title.trim().length < 3) {
      throw new Error('Survey title must be at least 3 characters long.');
    }

    const slug = this.generateSlug(title);

    return await Survey.create({
      userId,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: category || 'General',
      status: 'draft',
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      requireLogin: Boolean(requireLogin),
      allowAnonymous: allowAnonymous !== undefined ? Boolean(allowAnonymous) : true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      slug
    });
  }

  static async getSurveyWithQuestions(identifier) {
    const isNumeric = /^\d+$/.test(identifier);
    const where = isNumeric ? { id: parseInt(identifier, 10) } : { slug: identifier };

    return await Survey.findOne({
      where,
      include: [
        {
          model: SurveyQuestion,
          as: 'questions',
          include: [{ model: SurveyQuestionOption, as: 'options' }]
        },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [
        [{ model: SurveyQuestion, as: 'questions' }, 'orderIndex', 'ASC'],
        [{ model: SurveyQuestion, as: 'questions' }, { model: SurveyQuestionOption, as: 'options' }, 'orderIndex', 'ASC']
      ]
    });
  }

  static async countSurveyResponses(surveyId) {
    return await SurveyResponse.count({ where: { surveyId } });
  }

  static async hasUserResponded(surveyId, { userId, sessionId, ip }) {
    const orConditions = [];
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });
    const ipHash = this.hashIp(ip);
    if (ipHash) orConditions.push({ ipHash });

    if (orConditions.length === 0) return false;

    const existing = await SurveyResponse.findOne({
      where: {
        surveyId,
        [Op.or]: orConditions
      }
    });
    return !!existing;
  }

  static async addQuestion(surveyId, userId, questionData, isAdmin = false) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) throw new Error('Survey not found.');
    if (survey.userId !== userId && !isAdmin) {
      throw new Error('Unauthorized to modify this survey.');
    }

    // Safety lock: check if responses exist
    const responseCount = await this.countSurveyResponses(surveyId);
    if (responseCount > 0) {
      throw new Error('Cannot add questions: Survey already has responses recorded. Question structure is locked to protect data integrity.');
    }

    const { questionText, helpText, questionType, isRequired, options } = questionData;
    if (!questionText || !questionText.trim()) {
      throw new Error('Question text is required.');
    }

    const validTypes = ['single_choice', 'multiple_choice', 'short_text', 'long_text', 'rating', 'yes_no'];
    if (!validTypes.includes(questionType)) {
      throw new Error('Invalid question type specified.');
    }

    const currentCount = await SurveyQuestion.count({ where: { surveyId } });

    return await sequelize.transaction(async (t) => {
      const question = await SurveyQuestion.create({
        surveyId,
        questionText: questionText.trim(),
        helpText: helpText ? helpText.trim() : null,
        questionType,
        isRequired: isRequired !== undefined ? Boolean(isRequired) : true,
        orderIndex: currentCount
      }, { transaction: t });

      if (['single_choice', 'multiple_choice'].includes(questionType) && Array.isArray(options)) {
        const validOpts = options
          .map(o => (typeof o === 'string' ? o.trim() : ''))
          .filter(o => o.length > 0);

        if (validOpts.length < 2) {
          throw new Error('Choice questions require at least two answer options.');
        }

        const optionRows = validOpts.map((text, idx) => ({
          questionId: question.id,
          optionText: text,
          orderIndex: idx
        }));
        await SurveyQuestionOption.bulkCreate(optionRows, { transaction: t });
      }

      return question;
    });
  }

  static async deleteQuestion(questionId, userId, isAdmin = false) {
    const question = await SurveyQuestion.findByPk(questionId, {
      include: [{ model: Survey }]
    });
    if (!question) throw new Error('Question not found.');

    const survey = question.Survey;
    if (survey.userId !== userId && !isAdmin) {
      throw new Error('Unauthorized.');
    }

    const responseCount = await this.countSurveyResponses(survey.id);
    if (responseCount > 0) {
      throw new Error('Cannot delete questions from a survey with existing responses.');
    }

    await question.destroy();
    return true;
  }

  static async submitSurveyResponse({ surveyId, answers, userId, sessionId, ip }) {
    const survey = await this.getSurveyWithQuestions(surveyId);
    if (!survey) throw new Error('Survey not found.');

    if (survey.status !== 'published') {
      throw new Error('This survey is currently not accepting responses.');
    }

    if (survey.isExpired) {
      throw new Error('This survey has expired.');
    }

    if (survey.requireLogin && !userId) {
      throw new Error('Authentication is required to submit a response for this survey.');
    }

    const alreadyResponded = await this.hasUserResponded(survey.id, { userId, sessionId, ip });
    if (alreadyResponded) {
      throw new Error('You have already submitted a response to this survey.');
    }

    // Server-side validation of each question
    const questions = survey.questions || [];
    for (const q of questions) {
      const userVal = answers[q.id];

      if (q.isRequired) {
        if (userVal === undefined || userVal === null || userVal === '' || (Array.isArray(userVal) && userVal.length === 0)) {
          throw new Error(`Question "${q.questionText}" is required.`);
        }
      }

      if (userVal !== undefined && userVal !== null && userVal !== '') {
        if (q.questionType === 'rating') {
          const ratingNum = parseInt(userVal, 10);
          if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new Error(`Rating for "${q.questionText}" must be between 1 and 5.`);
          }
        } else if (q.questionType === 'yes_no') {
          if (!['true', 'false', true, false].includes(userVal)) {
            throw new Error(`Invalid answer for "${q.questionText}".`);
          }
        } else if (['single_choice', 'multiple_choice'].includes(q.questionType)) {
          const optList = Array.isArray(userVal) ? userVal.map(Number) : [Number(userVal)];
          const validOptIds = new Set(q.options.map(o => o.id));
          for (const optId of optList) {
            if (!validOptIds.has(optId)) {
              throw new Error(`Invalid option selected for question "${q.questionText}".`);
            }
          }
        }
      }
    }

    const ipHash = this.hashIp(ip);

    return await sequelize.transaction(async (t) => {
      const response = await SurveyResponse.create({
        surveyId: survey.id,
        userId: userId || null,
        sessionId: sessionId || null,
        ipHash: ipHash || null,
        submittedAt: new Date()
      }, { transaction: t });

      for (const q of questions) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') continue;

        if (q.questionType === 'short_text' || q.questionType === 'long_text') {
          await SurveyAnswer.create({
            responseId: response.id,
            questionId: q.id,
            textValue: String(val).trim()
          }, { transaction: t });
        } else if (q.questionType === 'rating') {
          await SurveyAnswer.create({
            responseId: response.id,
            questionId: q.id,
            numericValue: parseInt(val, 10)
          }, { transaction: t });
        } else if (q.questionType === 'yes_no') {
          await SurveyAnswer.create({
            responseId: response.id,
            questionId: q.id,
            booleanValue: val === 'true' || val === true
          }, { transaction: t });
        } else if (q.questionType === 'single_choice') {
          const answer = await SurveyAnswer.create({
            responseId: response.id,
            questionId: q.id
          }, { transaction: t });
          await SurveyAnswerSelection.create({
            answerId: answer.id,
            questionOptionId: Number(val)
          }, { transaction: t });
        } else if (q.questionType === 'multiple_choice') {
          const answer = await SurveyAnswer.create({
            responseId: response.id,
            questionId: q.id
          }, { transaction: t });
          const selectedOpts = Array.isArray(val) ? val.map(Number) : [Number(val)];
          for (const optId of selectedOpts) {
            await SurveyAnswerSelection.create({
              answerId: answer.id,
              questionOptionId: optId
            }, { transaction: t });
          }
        }
      }

      return response;
    });
  }

  static async getSurveyAnalytics(surveyId) {
    const survey = await this.getSurveyWithQuestions(surveyId);
    if (!survey) throw new Error('Survey not found.');

    const totalResponses = await SurveyResponse.count({ where: { surveyId: survey.id } });

    const questionAnalytics = [];

    for (const q of survey.questions) {
      const item = {
        id: q.id,
        questionText: q.questionText,
        helpText: q.helpText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        totalAnswers: 0,
        data: null
      };

      if (['single_choice', 'multiple_choice'].includes(q.questionType)) {
        const optionCounts = await Promise.all(
          q.options.map(async (opt) => {
            const count = await SurveyAnswerSelection.count({
              where: { questionOptionId: opt.id }
            });
            return {
              id: opt.id,
              text: opt.optionText,
              count
            };
          })
        );
        const totalAnswersForQ = optionCounts.reduce((acc, curr) => acc + curr.count, 0);
        item.totalAnswers = totalAnswersForQ;
        item.data = {
          options: optionCounts.map(o => ({
            ...o,
            percentage: totalAnswersForQ > 0 ? ((o.count / totalAnswersForQ) * 100).toFixed(1) : '0.0'
          }))
        };
      } else if (q.questionType === 'rating') {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const answers = await SurveyAnswer.findAll({
          where: { questionId: q.id, numericValue: { [Op.ne]: null } }
        });
        let sum = 0;
        answers.forEach(a => {
          if (counts[a.numericValue] !== undefined) {
            counts[a.numericValue]++;
            sum += a.numericValue;
          }
        });
        const total = answers.length;
        item.totalAnswers = total;
        item.data = {
          counts,
          average: total > 0 ? (sum / total).toFixed(2) : '0.00'
        };
      } else if (q.questionType === 'yes_no') {
        const yesCount = await SurveyAnswer.count({
          where: { questionId: q.id, booleanValue: true }
        });
        const noCount = await SurveyAnswer.count({
          where: { questionId: q.id, booleanValue: false }
        });
        const total = yesCount + noCount;
        item.totalAnswers = total;
        item.data = {
          yes: yesCount,
          no: noCount,
          yesPercentage: total > 0 ? ((yesCount / total) * 100).toFixed(1) : '0.0',
          noPercentage: total > 0 ? ((noCount / total) * 100).toFixed(1) : '0.0'
        };
      } else if (['short_text', 'long_text'].includes(q.questionType)) {
        const answers = await SurveyAnswer.findAll({
          where: { questionId: q.id, textValue: { [Op.ne]: null } },
          limit: 50,
          order: [['createdAt', 'DESC']]
        });
        item.totalAnswers = await SurveyAnswer.count({
          where: { questionId: q.id, textValue: { [Op.ne]: null } }
        });
        item.data = {
          sampleResponses: answers.map(a => a.textValue)
        };
      }

      questionAnalytics.push(item);
    }

    return {
      survey,
      totalResponses,
      questions: questionAnalytics
    };
  }

  static async listPublicSurveys({ category, search, page = 1, limit = 9 }) {
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

    const { count, rows } = await Survey.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: SurveyQuestion, as: 'questions', attributes: ['id'] },
        { model: SurveyResponse, as: 'responses', attributes: ['id'] }
      ],
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      surveys: rows,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = SurveyService;
