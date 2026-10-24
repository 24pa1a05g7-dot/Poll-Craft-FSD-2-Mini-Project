process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');

describe('Authentication & Access Control Test Suite', () => {
  before(async () => {
    await sequelize.sync({ force: true });
  });

  after(async () => {
    await sequelize.close();
  });

  test('GET /auth/register renders registration page', async () => {
    const res = await request(app).get('/auth/register');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Create an [aA]ccount/);
  });

  test('POST /auth/register succeeds with valid details and always sets role=user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Test Candidate',
        email: 'candidate@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'admin' // Attempted privilege escalation should be ignored
      });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/dashboard');

    const created = await User.findOne({ where: { email: 'candidate@test.com' } });
    assert.ok(created);
    assert.strictEqual(created.name, 'Test Candidate');
    // Public registration always assigns regular user role (prevents privilege escalation)
    assert.strictEqual(created.role, 'user');
  });

  test('POST /auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Another User',
        email: 'candidate@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

    assert.strictEqual(res.status, 409);
    assert.match(res.text, /already exists/);
  });

  test('POST /auth/login fails with invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({
        email: 'candidate@test.com',
        password: 'WrongPassword999!'
      });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid email or password/);
  });

  test('POST /auth/login succeeds with correct password and sets session cookie', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({
        email: 'candidate@test.com',
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/dashboard');
    assert.ok(res.headers['set-cookie']);
  });

  test('GET /dashboard redirects unauthenticated users to /auth/login', async () => {
    const res = await request(app).get('/dashboard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/auth/login');
  });

  test('Dedicated CLI admin script creates administrator account successfully', () => {
    const { execSync } = require('child_process');
    const output = execSync('node scripts/create-admin.js cli-admin@pollcraft.io SecureAdmin99! "CLI Admin"', {
      env: { ...process.env, NODE_ENV: 'test' }
    }).toString();
    assert.match(output, /Administrator/);
  });
});
