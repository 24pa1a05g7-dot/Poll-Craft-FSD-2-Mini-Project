process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { sequelize, User, Survey, SurveyQuestion } = require('../src/models');
const SurveyService = require('../src/services/surveyService');
const CsvService = require('../src/services/csvService');

describe('Survey Management, Validation & CSV Test Suite', () => {
  let user, survey, qChoice, qRating, qText, qYesNo;

  before(async () => {
    await sequelize.sync({ force: true });

    user = await User.create({
      name: 'Dr. Evans',
      email: 'evans@university.edu',
      password: 'Password123!',
      role: 'user'
    });
  });

  after(async () => {
    await sequelize.close();
  });

  test('Creates a new survey in draft status', async () => {
    survey = await SurveyService.createSurvey(user.id, {
      title: 'Course Evaluation 2026',
      description: 'Student course feedback',
      category: 'Academics'
    });

    assert.ok(survey.id);
    assert.strictEqual(survey.status, 'draft');
  });

  test('Adds questions of multiple types to survey', async () => {
    qChoice = await SurveyService.addQuestion(survey.id, user.id, {
      questionText: 'How did you attend lectures?',
      questionType: 'single_choice',
      isRequired: true,
      options: ['In-person classroom', 'Live stream', 'Recorded videos']
    });
    assert.ok(qChoice.id);

    qRating = await SurveyService.addQuestion(survey.id, user.id, {
      questionText: 'Rate the course content clarity',
      questionType: 'rating',
      isRequired: true
    });
    assert.ok(qRating.id);

    qText = await SurveyService.addQuestion(survey.id, user.id, {
      questionText: 'Any specific feedback for the instructor?',
      questionType: 'short_text',
      isRequired: false
    });
    assert.ok(qText.id);

    qYesNo = await SurveyService.addQuestion(survey.id, user.id, {
      questionText: 'Would you recommend this course to peers?',
      questionType: 'yes_no',
      isRequired: true
    });
    assert.ok(qYesNo.id);

    const questions = await SurveyQuestion.findAll({ where: { surveyId: survey.id } });
    assert.strictEqual(questions.length, 4);
  });

  test('Generates valid CSV even when survey has zero responses', async () => {
    const csv = await CsvService.generateSurveyCsv(survey.id);
    assert.ok(csv);
    assert.match(csv, /Response ID/);
    assert.match(csv, /How did you attend lectures\?/);
  });

  test('Submits valid survey responses across all question types', async () => {
    // Publish survey first
    survey.status = 'published';
    await survey.save();

    const fullSurvey = await SurveyService.getSurveyWithQuestions(survey.id);
    const choiceOptId = fullSurvey.questions[0].options[0].id;

    const answers = {
      [qChoice.id]: choiceOptId,
      [qRating.id]: 5,
      [qText.id]: 'Outstanding curriculum and clear slides.',
      [qYesNo.id]: 'true'
    };

    const response = await SurveyService.submitSurveyResponse({
      surveyId: survey.id,
      answers,
      userId: null,
      sessionId: 'session_survey_user_1',
      ip: '192.168.1.100'
    });

    assert.ok(response.id);

    const analytics = await SurveyService.getSurveyAnalytics(survey.id);
    assert.strictEqual(analytics.totalResponses, 1);
    assert.strictEqual(analytics.questions[1].data.average, '5.00');
    assert.strictEqual(analytics.questions[3].data.yes, 1);
  });

  test('Rejects duplicate response from the same session', async () => {
    const fullSurvey = await SurveyService.getSurveyWithQuestions(survey.id);
    const choiceOptId = fullSurvey.questions[0].options[0].id;

    const answers = {
      [qChoice.id]: choiceOptId,
      [qRating.id]: 4,
      [qYesNo.id]: 'true'
    };

    await assert.rejects(
      async () => {
        await SurveyService.submitSurveyResponse({
          surveyId: survey.id,
          answers,
          sessionId: 'session_survey_user_1', // duplicate session
          ip: '10.0.0.99'
        });
      },
      /already submitted a response/
    );
  });

  test('Rejects response when required question is omitted', async () => {
    const answersWithoutRequired = {
      [qText.id]: 'Only text filled'
      // qChoice, qRating, qYesNo omitted
    };

    await assert.rejects(
      async () => {
        await SurveyService.submitSurveyResponse({
          surveyId: survey.id,
          answers: answersWithoutRequired,
          sessionId: 'session_fresh_99',
          ip: '10.0.0.88'
        });
      },
      /is required/
    );
  });

  test('Rejects response with invalid option ID', async () => {
    const invalidAnswers = {
      [qChoice.id]: 999999, // non-existent option id
      [qRating.id]: 4,
      [qYesNo.id]: 'true'
    };

    await assert.rejects(
      async () => {
        await SurveyService.submitSurveyResponse({
          surveyId: survey.id,
          answers: invalidAnswers,
          sessionId: 'session_fresh_98',
          ip: '10.0.0.87'
        });
      },
      /Invalid option selected/
    );
  });

  test('Prevents structural changes (adding questions) once responses exist', async () => {
    await assert.rejects(
      async () => {
        await SurveyService.addQuestion(survey.id, user.id, {
          questionText: 'Late added question?',
          questionType: 'short_text'
        });
      },
      /Cannot add questions: Survey already has responses recorded/
    );
  });

  test('Generates complete CSV export with respondent rows', async () => {
    const csv = await CsvService.generateSurveyCsv(survey.id);
    assert.ok(csv);
    assert.match(csv, /Outstanding curriculum and clear slides\./);
    assert.match(csv, /In-person classroom/);
  });
});
