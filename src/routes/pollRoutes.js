const express = require('express');
const router = express.Router();
const PollController = require('../controllers/pollController');
const { ensureAuthenticated } = require('../middleware/auth');

// Public listing
router.get('/', PollController.renderPollsList);

// Create poll (Auth required)
router.get('/new', ensureAuthenticated, PollController.renderCreatePoll);
router.post('/new', ensureAuthenticated, PollController.createPoll);
router.post('/', ensureAuthenticated, PollController.createPoll);

// Specific poll routes
router.get('/:slugOrId', PollController.renderPollVote);
router.post('/:slugOrId/vote', PollController.submitPollVote);
router.get('/:slugOrId/results', PollController.renderPollResults);

// Edit & Delete
router.get('/:slugOrId/edit', ensureAuthenticated, PollController.renderEditPoll);
router.post('/:slugOrId/edit', ensureAuthenticated, PollController.updatePoll);
router.post('/:id/delete', ensureAuthenticated, PollController.deletePoll);

module.exports = router;
