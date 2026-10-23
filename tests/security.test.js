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
});
