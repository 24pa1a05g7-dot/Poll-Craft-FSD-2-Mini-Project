const SurveyService = require('../services/surveyService');
const CsvService = require('../services/csvService');
const { Survey, SurveyResponse, SurveyAnswer, SurveyQuestion, SurveyQuestionOption, User } = require('../models');

class SurveyController {
  static async renderSurveysList(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const category = req.query.category || 'All';
      const search = req.query.search || '';

      const { surveys, totalCount, currentPage, totalPages } = await SurveyService.listPublicSurveys({
        category,
        search,
        page,
        limit: 9
      });

      res.render('pages/surveys/index', {
        title: 'Explore Surveys - PollCraft',
        surveys,
        category,
        search,
        currentPage,
        totalPages,
        totalCount
      });
    } catch (err) {
      console.error('[LIST SURVEYS ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error Loading Surveys',
        message: 'Could not load survey directory.'
      });
    }
  }

  static renderCreateSurvey(req, res) {
    res.render('pages/surveys/create', {
      title: 'Create a New Survey - PollCraft',
      formData: {},
      errors: []
    });
  }

  static async createSurvey(req, res) {
    const { title, description, category, isPublic, requireLogin, allowAnonymous, expiresAt } = req.body;
    try {
      // Validate inputs and prevent mass-assignment
      const survey = await SurveyService.createSurvey(req.user.id, {
        title,
        description,
        category,
        isPublic: isPublic === 'true' || isPublic === 'on',
        requireLogin: requireLogin === 'true' || requireLogin === 'on',
        allowAnonymous: allowAnonymous === 'true' || allowAnonymous === 'on',
        expiresAt: expiresAt || null
      });

      req.flash('success', 'Survey initialized! Add your questionnaire questions in the builder below.');
      return res.redirect(`/surveys/${survey.id}/builder`);
    } catch (err) {
      console.error('[CREATE SURVEY ERROR]:', err);
      return res.status(400).render('pages/surveys/create', {
        title: 'Create a New Survey - PollCraft',
        formData: req.body,
        errors: [err.message || 'Failed to create survey. Please check inputs.']
      });
    }
  }

  static async renderSurveyBuilder(req, res) {
    try {
      const surveyId = req.params.id;
      const survey = await SurveyService.getSurveyWithQuestions(surveyId);

      if (!survey) {
        return res.status(404).render('pages/errors/404', {
          title: 'Survey Not Found',
          message: 'The requested survey does not exist.'
        });
      }

      // Strict ownership check: only the survey author can manage the question builder
      if (survey.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to manage questions on a survey you do not own.'
        });
      }

      const responseCount = await SurveyService.countSurveyResponses(survey.id);

      res.render('pages/surveys/builder', {
        title: `Survey Builder: ${survey.title} - PollCraft`,
        survey,
        responseCount,
        isLocked: responseCount > 0,
        errors: []
      });
    } catch (err) {
      console.error('[BUILDER ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error loading builder',
        message: 'Could not load survey editor.'
      });
    }
  }

  static async addQuestion(req, res) {
    const surveyId = req.params.id;
    try {
      const survey = await Survey.findByPk(surveyId);
      if (!survey) {
        return res.status(404).render('pages/errors/404', { title: 'Survey Not Found' });
      }

      // Strict ownership check
      if (survey.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to modify this survey.'
        });
      }

      const { questionText, helpText, questionType, isRequired, options } = req.body;

      let parsedOptions = [];
      if (options) {
        if (Array.isArray(options)) {
          parsedOptions = options;
        } else if (typeof options === 'string') {
          parsedOptions = options.split('\n').map(s => s.trim()).filter(Boolean);
        }
      }

      await SurveyService.addQuestion(surveyId, req.user.id, {
        questionText,
        helpText,
        questionType,
        isRequired: isRequired === 'true' || isRequired === 'on',
        options: parsedOptions
      });

      req.flash('success', 'Question added to survey.');
      return res.redirect(`/surveys/${surveyId}/builder`);
    } catch (err) {
      console.error('[ADD QUESTION ERROR]:', err);
      req.flash('error', err.message || 'Failed to add question.');
      return res.redirect(`/surveys/${surveyId}/builder`);
    }
  }

  static async deleteQuestion(req, res) {
    const { surveyId, questionId } = req.params;
    try {
      const survey = await Survey.findByPk(surveyId);
      if (!survey) {
        return res.status(404).render('pages/errors/404', { title: 'Survey Not Found' });
      }

      // Strict ownership check
      if (survey.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to delete questions from this survey.'
        });
      }

      await SurveyService.deleteQuestion(questionId, req.user.id);

      req.flash('success', 'Question removed from survey.');
      return res.redirect(`/surveys/${surveyId}/builder`);
    } catch (err) {
      console.error('[DELETE QUESTION ERROR]:', err);
      req.flash('error', err.message || 'Failed to delete question.');
      return res.redirect(`/surveys/${surveyId}/builder`);
    }
  }

  static async updateStatus(req, res) {
    const surveyId = req.params.id;
    const { status } = req.body;

    try {
      const survey = await Survey.findByPk(surveyId, {
        include: [{ model: SurveyQuestion, as: 'questions' }]
      });
      if (!survey) {
        return res.status(404).render('pages/errors/404', { title: 'Survey Not Found' });
      }

      // Strict ownership check
      if (survey.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to change this survey status.'
        });
      }

      if (status === 'published' && (!survey.questions || survey.questions.length === 0)) {
        req.flash('error', 'Cannot publish a survey without at least one question.');
        return res.redirect(`/surveys/${surveyId}/builder`);
      }

      // Whitelist valid status transitions
      if (!['draft', 'published', 'closed'].includes(status)) {
        req.flash('error', 'Invalid survey status specified.');
        return res.redirect(`/surveys/${surveyId}/builder`);
      }

      survey.status = status;
      await survey.save();

      req.flash('success', `Survey status updated to "${status}".`);
      return res.redirect(`/surveys/${surveyId}/builder`);
    } catch (err) {
      console.error('[UPDATE STATUS ERROR]:', err);
      req.flash('error', 'Failed to update survey status.');
      return res.redirect(`/surveys/${surveyId}/builder`);
    }
  }

  static async renderSurveyRespond(req, res) {
    try {
      const identifier = req.params.slugOrId;
      const survey = await SurveyService.getSurveyWithQuestions(identifier);

      if (!survey) {
        return res.status(404).render('pages/errors/404', {
          title: 'Survey Not Found',
          message: 'The requested survey could not be located.'
        });
      }

      // Draft survey response forms are accessible only by the creator for testing
      if (survey.status === 'draft') {
        const isOwner = req.user && req.user.id === survey.userId;
        if (!isOwner) {
          return res.status(404).render('pages/errors/404', {
            title: 'Survey Not Available',
            message: 'This survey is currently an unpublished draft.'
          });
        }
      }

      const userId = req.user ? req.user.id : null;
      const sessionId = req.sessionID;
      const ip = req.ip || req.connection.remoteAddress;

      const hasResponded = await SurveyService.hasUserResponded(survey.id, { userId, sessionId, ip });

      res.render('pages/surveys/respond', {
        title: `${survey.title} - PollCraft Survey`,
        survey,
        hasResponded,
        errors: [],
        formData: {},
        appUrl: process.env.APP_URL || `http://${req.headers.host}`
      });
    } catch (err) {
      console.error('[RESPOND VIEW ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error',
        message: 'Unable to open survey.'
      });
    }
  }

  static async submitSurveyResponse(req, res) {
    const identifier = req.params.slugOrId;
    try {
      const survey = await SurveyService.getSurveyWithQuestions(identifier);
      if (!survey) {
        return res.status(404).render('pages/errors/404', { title: 'Survey Not Found' });
      }

      const userId = req.user ? req.user.id : null;
      const sessionId = req.sessionID;
      const ip = req.ip || req.connection.remoteAddress;

      // Extract only valid question answers prefixed with q_
      const answers = {};
      for (const key of Object.keys(req.body)) {
        if (key.startsWith('q_')) {
          const qId = parseInt(key.replace('q_', ''), 10);
          if (!isNaN(qId)) {
            answers[qId] = req.body[key];
          }
        }
      }

      await SurveyService.submitSurveyResponse({
        surveyId: survey.id,
        answers,
        userId,
        sessionId,
        ip
      });

      req.flash('success', 'Your responses have been recorded successfully. Thank you for your feedback!');
      return res.redirect(`/surveys/${survey.slug}/results`);
    } catch (err) {
      console.error('[SUBMIT RESPONSE ERROR]:', err);
      const survey = await SurveyService.getSurveyWithQuestions(identifier);
      return res.status(400).render('pages/surveys/respond', {
        title: survey ? `${survey.title} - PollCraft Survey` : 'Error',
        survey,
        hasResponded: false,
        errors: [err.message || 'Submission error. Please check your answers.'],
        formData: req.body,
        appUrl: process.env.APP_URL || `http://${req.headers.host}`
      });
    }
  }

  static async renderSurveyResults(req, res) {
    try {
      const identifier = req.params.slugOrId;
      const survey = await SurveyService.getSurveyWithQuestions(identifier);

      if (!survey) {
        return res.status(404).render('pages/errors/404', {
          title: 'Survey Not Found',
          message: 'Survey results not found.'
        });
      }

      const isOwner = req.user && req.user.id === survey.userId;

      // Draft survey results are restricted to owner
      if (survey.status === 'draft' && !isOwner) {
        return res.status(404).render('pages/errors/404', {
          title: 'Survey Not Found',
          message: 'This survey is unpublished.'
        });
      }

      // Private/unlisted survey results are strictly restricted to owner
      if (!survey.isPublic && !isOwner) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Private Results',
          message: 'Analytics for this private survey are restricted to the author.'
        });
      }

      const analytics = await SurveyService.getSurveyAnalytics(survey.id);

      res.render('pages/surveys/results', {
        title: `Results: ${survey.title} - PollCraft`,
        survey: analytics.survey,
        totalResponses: analytics.totalResponses,
        questions: analytics.questions,
        isOwner,
        appUrl: process.env.APP_URL || `http://${req.headers.host}`
      });
    } catch (err) {
      console.error('[SURVEY RESULTS ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error Loading Analytics',
        message: 'Could not load survey analytics.'
      });
    }
  }

  static async renderSurveyResponses(req, res) {
    const surveyId = req.params.id;
    try {
      const survey = await Survey.findByPk(surveyId, {
        include: [{ model: SurveyQuestion, as: 'questions' }]
      });
      if (!survey) return res.status(404).render('pages/errors/404', { title: 'Survey Not Found' });

      // Strict ownership check: only the survey author can inspect individual responses
      if (survey.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You are not authorized to inspect individual survey responses for this questionnaire.'
        });
      }

      const responses = await SurveyResponse.findAll({
        where: { surveyId },
        include: [
          { model: User, as: 'respondent', attributes: ['id', 'name', 'email'] },
          {
            model: SurveyAnswer,
            as: 'answers',
            include: [
              { model: SurveyQuestion, as: 'question' },
              { model: SurveyQuestionOption, as: 'selectedOptions' }
            ]
          }
        ],
        order: [['submittedAt', 'DESC']]
      });

      res.render('pages/surveys/responses', {
        title: `Individual Submissions: ${survey.title} - PollCraft`,
        survey,
        responses
      });
    } catch (err) {
      console.error('[INDIVIDUAL RESPONSES ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Error',
        message: 'Could not load individual submissions.'
      });
    }
  }

  static async exportSurveyCsv(req, res) {
    const surveyId = req.params.id;
    try {
      const survey = await Survey.findByPk(surveyId);
      if (!survey) return res.status(404).send('Survey not found');

      // Strict ownership check: only the author can export CSV data
      if (survey.userId !== req.user.id) {
        return res.status(403).send('Forbidden: Not authorized to export responses for this survey.');
      }

      const csvData = await CsvService.generateSurveyCsv(surveyId);

      const filename = `pollcraft_survey_${surveyId}_responses_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvData);
    } catch (err) {
      console.error('[CSV EXPORT ERROR]:', err);
      return res.status(500).send('Error generating CSV export.');
    }
  }

  static async deleteSurvey(req, res) {
    const surveyId = req.params.id;
    try {
      const survey = await Survey.findByPk(surveyId);
      if (!survey) return res.status(404).render('pages/errors/404', { title: 'Survey Not Found' });

      // Strict ownership check
      if (survey.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to delete this survey.'
        });
      }

      await survey.destroy();
      req.flash('success', 'Survey was deleted successfully.');
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('[DELETE SURVEY ERROR]:', err);
      req.flash('error', 'Failed to delete survey.');
      return res.redirect('/dashboard');
    }
  }
}

module.exports = SurveyController;
