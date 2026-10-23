process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Poll, PollOption } = require('../src/models');
const PollService = require('../src/services/pollService');

describe('Poll Management & Voting Test Suite', () => {
  let user1, user2, samplePoll;

  before(async () => {
    await sequelize.sync({ force: true });

    user1 = await User.create({
      name: 'Organizer One',
      email: 'org1@test.com',
      password: 'Password123!',
      role: 'user'
    });

    user2 = await User.create({
      name: 'Organizer Two',
      email: 'org2@test.com',
      password: 'Password123!',
      role: 'user'
    });
  });

  after(async () => {
    await sequelize.close();
  });

  test('PollService.createPoll creates poll with options', async () => {
    samplePoll = await PollService.createPoll(user1.id, {
      title: 'Which cloud provider do you prefer?',
      description: 'Vote for your preferred cloud host',
      category: 'Technology',
      options: ['AWS', 'Google Cloud', 'Render / Fly.io'],
      isMultipleChoice: false,
      isAnonymous: true,
      requireLogin: false
    });

    assert.ok(samplePoll.id);
    assert.strictEqual(samplePoll.title, 'Which cloud provider do you prefer?');

    const options = await PollOption.findAll({ where: { pollId: samplePoll.id } });
    assert.strictEqual(options.length, 3);
  });

  test('PollService.createPoll rejects poll with < 2 options', async () => {
    await assert.rejects(
      async () => {
        await PollService.createPoll(user1.id, {
          title: 'Invalid poll',
          options: ['Just one option']
        });
      },
      /at least 2 distinct answer options/
    );
  });

  test('Submits valid vote and records vote selection', async () => {
    const pollWithOpts = await PollService.getPollByIdOrSlug(samplePoll.id);
    const chosenOption = pollWithOpts.options[0];

    const vote = await PollService.submitVote({
      pollId: samplePoll.id,
      optionIds: [chosenOption.id],
      userId: null,
      sessionId: 'session_unique_1',
      ip: '127.0.0.1'
    });

    assert.ok(vote.id);

    const results = await PollService.getPollResults(samplePoll.id);
    assert.strictEqual(results.totalVotes, 1);
    assert.strictEqual(results.options[0].votesCount, 1);
    assert.strictEqual(results.options[0].percentage, 100);
  });

  test('Rejects duplicate vote from same session ID', async () => {
    const pollWithOpts = await PollService.getPollByIdOrSlug(samplePoll.id);
    const chosenOption = pollWithOpts.options[1];

    await assert.rejects(
      async () => {
        await PollService.submitVote({
          pollId: samplePoll.id,
          optionIds: [chosenOption.id],
          userId: null,
          sessionId: 'session_unique_1', // duplicate session
          ip: '192.168.1.50'
        });
      },
      /already submitted a vote/
    );
  });

  test('Rejects vote on closed poll', async () => {
    const closedPoll = await PollService.createPoll(user1.id, {
      title: 'Closed Voting Session',
      options: ['Option A', 'Option B']
    });

    closedPoll.status = 'closed';
    await closedPoll.save();

    const options = await PollOption.findAll({ where: { pollId: closedPoll.id } });

    await assert.rejects(
      async () => {
        await PollService.submitVote({
          pollId: closedPoll.id,
          optionIds: [options[0].id],
          sessionId: 'session_fresh_2',
          ip: '10.0.0.1'
        });
      },
      /not accepting votes because it is not published/
    );
  });

  test('Rejects vote on expired poll', async () => {
    const expiredPoll = await PollService.createPoll(user1.id, {
      title: 'Expired Poll Deadline',
      options: ['Option 1', 'Option 2'],
      expiresAt: new Date(Date.now() - 10000) // 10 seconds in the past
    });

    const options = await PollOption.findAll({ where: { pollId: expiredPoll.id } });

    await assert.rejects(
      async () => {
        await PollService.submitVote({
          pollId: expiredPoll.id,
          optionIds: [options[0].id],
          sessionId: 'session_fresh_3',
          ip: '10.0.0.2'
        });
      },
      /has closed and expired/
    );
  });

  test('Ownership check: user2 cannot modify user1 poll', async () => {
    await assert.rejects(
      async () => {
        await PollService.updatePoll(samplePoll.id, user2.id, { title: 'Hijacked Title' }, false);
      },
      /Unauthorized/
    );
  });
});
