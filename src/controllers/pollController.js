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
        title: 'Explore Community Polls - PollCraft',
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
      title: 'Create a New Poll - PollCraft',
      formData: {},
      errors: []
    });
  }

  static async createPoll(req, res) {
    const { title, description, category, options, isMultipleChoice, isAnonymous, requireLogin, isPublic, expiresAt } = req.body;
    try {
      // Validate inputs and prevent mass-assignment
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
        title: 'Create a New Poll - PollCraft',
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

      // If poll is draft, only the author may view/test it
      if (poll.status === 'draft') {
        const isOwner = req.user && req.user.id === poll.userId;
        if (!isOwner) {
          return res.status(404).render('pages/errors/404', {
            title: 'Poll Not Available',
            message: 'This poll is currently an unpublished draft.'
          });
        }
      }

      // Check voting history
      const userId = req.user ? req.user.id : null;
      const sessionId = req.sessionID;
      const ip = req.ip || req.connection.remoteAddress;

      const hasVoted = await PollService.hasUserVoted(poll.id, { userId, sessionId, ip });

      res.render('pages/polls/vote', {
        title: `${poll.title} - Vote on PollCraft`,
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
          title: `${poll.title} - Vote on PollCraft`,
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
        title: poll ? `${poll.title} - Vote on PollCraft` : 'Error',
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

      const isOwner = req.user && req.user.id === poll.userId;

      // Draft poll results are restricted to the owner
      if (poll.status === 'draft' && !isOwner) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'This poll is unpublished.'
        });
      }

      // Private/unlisted poll analytics check
      if (!poll.isPublic && !isOwner) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Private Results',
          message: 'Results for this private poll are restricted to the author.'
        });
      }

      const results = await PollService.getPollResults(poll.id);

      res.render('pages/polls/results', {
        title: `Results: ${poll.title} - PollCraft`,
        poll: results.poll,
        totalVotes: results.totalVotes,
        options: results.options,
        isOwner,
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

      // Strict ownership check: only the poll creator can access the edit view
      if (poll.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to modify a poll created by another user.'
        });
      }

      res.render('pages/polls/edit', {
        title: `Edit Poll: ${poll.title} - PollCraft`,
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

      // Strict ownership check
      if (poll.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to modify a poll created by another user.'
        });
      }

      const { title, description, category, status, isPublic, expiresAt } = req.body;

      // Whitelist update fields to prevent mass assignment
      await PollService.updatePoll(poll.id, req.user.id, {
        title,
        description,
        category,
        status,
        isPublic: isPublic === 'true' || isPublic === 'on',
        expiresAt: expiresAt || null
      });

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
      const poll = await Poll.findByPk(pollId);
      if (!poll) {
        return res.status(404).render('pages/errors/404', {
          title: 'Poll Not Found',
          message: 'The poll could not be found.'
        });
      }

      // Strict ownership check
      if (poll.userId !== req.user.id) {
        return res.status(403).render('pages/errors/403', {
          title: '403 Forbidden - Access Denied',
          message: 'You do not have permission to delete a poll created by another user.'
        });
      }

      await poll.destroy();
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
