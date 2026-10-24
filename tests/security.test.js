process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');

describe('Security, Authorization & CSRF Test Suite', () => {
  let regularUser, adminUser, regularAgent, adminAgent;

  before(async () => {
    await sequelize.sync({ force: true });

    adminUser = await User.create({
      name: 'Admin Boss',
      email: 'admin@sec.com',
      password: 'Password123!',
      role: 'admin'
    });

    regularUser = await User.create({
      name: 'Standard User',
      email: 'standard@sec.com',
      password: 'Password123!',
      role: 'user'
    });

    // Create session agents
    regularAgent = request.agent(app);
    await regularAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'standard@sec.com', password: 'Password123!' });

    adminAgent = request.agent(app);
    await adminAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'admin@sec.com', password: 'Password123!' });
  });

  after(async () => {
    await sequelize.close();
  });

  test('POST without CSRF token is rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'any@sec.com', password: 'Password123!' });

    assert.strictEqual(res.status, 403);
    assert.match(res.text, /CSRF/);
  });

  test('Non-admin user is blocked from /admin console with 403', async () => {
    const res = await regularAgent.get('/admin');
    assert.strictEqual(res.status, 403);
    assert.match(res.text, /403/);
  });

  test('Admin user is granted access to /admin console with 200', async () => {
    const res = await adminAgent.get('/admin');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Platform Administration Console/);
  });

  test('Security response headers include Helmet protections', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-frame-options']);
  });

  test('CSV Formula Injection Defense: sanitizes formula triggers (=, +, -, @, \\t, \\r)', async () => {
    const CsvService = require('../src/services/csvService');
    const { Survey, SurveyQuestion, SurveyResponse, SurveyAnswer } = require('../src/models');

    const testSurvey = await Survey.create({
      title: 'Security CSV Test',
      slug: 'sec-csv-' + Date.now(),
      status: 'published',
      userId: adminUser.id
    });

    const question = await SurveyQuestion.create({
      surveyId: testSurvey.id,
      questionText: 'Feedback',
      questionType: 'short_text',
      order: 1
    });

    const response = await SurveyResponse.create({
      surveyId: testSurvey.id,
      submittedAt: new Date(),
      ipAddress: '127.0.0.1'
    });

    await SurveyAnswer.create({
      responseId: response.id,
      questionId: question.id,
      textValue: '=cmd|\' /C calc\'!A0'
    });

    const csvOutput = await CsvService.generateSurveyCsv(testSurvey.id);
    // Formula trigger character must be prefixed with a single quote
    assert.match(csvOutput, /'=cmd\|/);
    assert.doesNotMatch(csvOutput, /,"=cmd\|/);
  });

  test('IDOR Protection: User B cannot edit or delete User A poll via HTTP endpoints', async () => {
    const PollService = require('../src/services/pollService');
    const userBPoll = await PollService.createPoll(adminUser.id, {
      title: 'Private Owner Poll',
      options: ['Option 1', 'Option 2']
    });

    // regularAgent attempts to edit userBPoll
    const editRes = await regularAgent
      .post(`/polls/${userBPoll.id}/edit`)
      .set('x-test-bypass-csrf', 'true')
      .send({
        title: 'Tampered Title',
        category: 'General',
        status: 'published'
      });

    assert.strictEqual(editRes.status, 403);
    assert.match(editRes.text, /Access Denied|Unauthorized|403/);

    // regularAgent attempts to delete userBPoll
    const delRes = await regularAgent
      .post(`/polls/${userBPoll.id}/delete`)
      .set('x-test-bypass-csrf', 'true');

    assert.strictEqual(delRes.status, 403);
    assert.match(delRes.text, /Access Denied|Unauthorized|403/);
  });

  test('IDOR Protection: User B cannot access User A private survey responses or CSV export', async () => {
    const SurveyService = require('../src/services/surveyService');
    const adminSurvey = await SurveyService.createSurvey(adminUser.id, {
      title: 'Private Admin Survey',
      category: 'Research'
    });

    // regularAgent attempts to view individual responses
    const respRes = await regularAgent.get(`/surveys/${adminSurvey.id}/responses`);
    assert.strictEqual(respRes.status, 403);

    // regularAgent attempts to download CSV export
    const exportRes = await regularAgent.get(`/surveys/${adminSurvey.id}/export/csv`);
    assert.strictEqual(exportRes.status, 403);
  });
});
