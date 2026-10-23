const express = require('express');
const router = express.Router();
const SurveyController = require('../controllers/surveyController');
const { ensureAuthenticated } = require('../middleware/auth');

// Public directory
router.get('/', SurveyController.renderSurveysList);

// Create survey
router.get('/new', ensureAuthenticated, SurveyController.renderCreateSurvey);
router.post('/new', ensureAuthenticated, SurveyController.createSurvey);
router.post('/', ensureAuthenticated, SurveyController.createSurvey);

// Survey Builder (Question design)
router.get('/:id/builder', ensureAuthenticated, SurveyController.renderSurveyBuilder);
router.post('/:id/builder/questions', ensureAuthenticated, SurveyController.addQuestion);
router.post('/:surveyId/builder/questions/:questionId/delete', ensureAuthenticated, SurveyController.deleteQuestion);
router.post('/:id/status', ensureAuthenticated, SurveyController.updateStatus);

// Individual responses & CSV export
router.get('/:id/responses', ensureAuthenticated, SurveyController.renderSurveyResponses);
router.get('/:id/export/csv', ensureAuthenticated, SurveyController.exportSurveyCsv);
router.post('/:id/delete', ensureAuthenticated, SurveyController.deleteSurvey);

// Public response & results
router.get('/:slugOrId', SurveyController.renderSurveyRespond);
router.post('/:slugOrId/respond', SurveyController.submitSurveyResponse);
router.get('/:slugOrId/results', SurveyController.renderSurveyResults);

module.exports = router;
