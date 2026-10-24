require('dotenv').config();
const {
  sequelize,
  User,
  Poll,
  PollOption,
  PollVote,
  PollVoteSelection,
  Survey,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveyResponse,
  SurveyAnswer,
  SurveyAnswerSelection
} = require('../src/models');
const crypto = require('crypto');

async function seed() {
  console.log('[SEED] Checking database for demonstration data (Safe Idempotent Seeding)...');
  
  // NEVER run sequelize.sync({ force: true }) - protect existing data!

  // 1. Safe Seeding of Demo Users (findOrCreate to prevent duplication or reset)
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@pollcraft.io' },
    defaults: {
      name: 'Admin Moderator',
      email: 'admin@pollcraft.io',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true
    }
  });

  const [sarah] = await User.findOrCreate({
    where: { email: 'sarah@university.edu' },
    defaults: {
      name: 'Prof. Sarah Jenkins',
      email: 'sarah@university.edu',
      password: 'Password123!',
      role: 'user',
      isActive: true
    }
  });

  const [alex] = await User.findOrCreate({
    where: { email: 'alex@student.org' },
    defaults: {
      name: 'Alex Rivera',
      email: 'alex@student.org',
      password: 'Password123!',
      role: 'user',
      isActive: true
    }
  });

  const [maya] = await User.findOrCreate({
    where: { email: 'maya@campus.edu' },
    defaults: {
      name: 'Maya Patel',
      email: 'maya@campus.edu',
      password: 'Password123!',
      role: 'user',
      isActive: true
    }
  });

  console.log('[SEED] Verified demonstration users.');

  // 2. Safe Seeding of Demonstration Polls
  const poll1Title = 'Preferred Primary Language for Modern Web Backends';
  const existingPoll1 = await Poll.findOne({ where: { title: poll1Title } });
  
  if (!existingPoll1) {
    const poll1 = await Poll.create({
      userId: sarah.id,
      title: poll1Title,
      description: 'Help the Department of Computer Science align upcoming elective courses with student industry interests.',
      category: 'Technology',
      isMultipleChoice: false,
      isAnonymous: true,
      requireLogin: false,
      isPublic: true,
      status: 'published',
      slug: 'preferred-web-backend-language-' + crypto.randomBytes(3).toString('hex')
    });

    const p1Options = await PollOption.bulkCreate([
      { pollId: poll1.id, optionText: 'JavaScript / Node.js & TypeScript', orderIndex: 0 },
      { pollId: poll1.id, optionText: 'Python (FastAPI / Django)', orderIndex: 1 },
      { pollId: poll1.id, optionText: 'Go (Golang)', orderIndex: 2 },
      { pollId: poll1.id, optionText: 'Rust (Axum / Actix)', orderIndex: 3 },
      { pollId: poll1.id, optionText: 'Java (Spring Boot)', orderIndex: 4 }
    ]);

    // Initial vote samples for demo poll 1
    const voteDistributions1 = [
      { optIdx: 0, count: 12 },
      { optIdx: 1, count: 8 },
      { optIdx: 2, count: 6 },
      { optIdx: 3, count: 5 },
      { optIdx: 4, count: 4 }
    ];

    for (const dist of voteDistributions1) {
      const opt = p1Options[dist.optIdx];
      for (let i = 0; i < dist.count; i++) {
        const vote = await PollVote.create({
          pollId: poll1.id,
          sessionId: crypto.randomBytes(16).toString('hex'),
          ipHash: crypto.createHash('sha256').update(`ip_${dist.optIdx}_${i}`).digest('hex')
        });
        await PollVoteSelection.create({
          voteId: vote.id,
          pollOptionId: opt.id
        });
      }
    }
  }

  // Poll 2: Campus Facility Hours
  const poll2Title = 'Should the Campus Central Library remain open 24/7 during exam weeks?';
  const existingPoll2 = await Poll.findOne({ where: { title: poll2Title } });
  
  if (!existingPoll2) {
    const poll2 = await Poll.create({
      userId: alex.id,
      title: poll2Title,
      description: 'Student Council initiative gathering feedback on 24-hour study spaces with security supervision.',
      category: 'Academics',
      isMultipleChoice: false,
      isAnonymous: true,
      requireLogin: false,
      isPublic: true,
      status: 'published',
      slug: 'library-24-7-exam-weeks-' + crypto.randomBytes(3).toString('hex')
    });

    const p2Options = await PollOption.bulkCreate([
      { pollId: poll2.id, optionText: 'Strongly Agree (Essential for preparation)', orderIndex: 0 },
      { pollId: poll2.id, optionText: 'Agree (Helpful during peak finals)', orderIndex: 1 },
      { pollId: poll2.id, optionText: 'Neutral (No strong preference)', orderIndex: 2 },
      { pollId: poll2.id, optionText: 'Disagree (Current midnight closure is sufficient)', orderIndex: 3 }
    ]);

    for (let i = 0; i < 18; i++) {
      const vote = await PollVote.create({
        pollId: poll2.id,
        sessionId: crypto.randomBytes(16).toString('hex'),
        ipHash: crypto.createHash('sha256').update(`ip_p2_${i}`).digest('hex')
      });
      const targetOpt = i < 12 ? p2Options[0] : (i < 15 ? p2Options[1] : p2Options[2]);
      await PollVoteSelection.create({
        voteId: vote.id,
        pollOptionId: targetOpt.id
      });
    }
  }

  // 3. Safe Seeding of Demonstration Surveys
  const survey1Title = 'Annual Student Campus Experience & Learning Environment Survey';
  const existingSurvey1 = await Survey.findOne({ where: { title: survey1Title } });

  if (!existingSurvey1) {
    const survey1 = await Survey.create({
      userId: sarah.id,
      title: survey1Title,
      description: 'A comprehensive institutional survey evaluating instructional support, digital learning resources, laboratory facilities, and overall campus wellness.',
      category: 'Academics',
      status: 'published',
      isPublic: true,
      requireLogin: false,
      allowAnonymous: true,
      slug: 'student-campus-experience-2026-' + crypto.randomBytes(3).toString('hex')
    });

    const q1 = await SurveyQuestion.create({
      surveyId: survey1.id,
      questionText: 'Which academic year are you currently enrolled in?',
      helpText: 'Select your current undergraduate or graduate level.',
      questionType: 'single_choice',
      isRequired: true,
      orderIndex: 0
    });
    const q1Opts = await SurveyQuestionOption.bulkCreate([
      { questionId: q1.id, optionText: 'First Year (Freshman)', orderIndex: 0 },
      { questionId: q1.id, optionText: 'Second Year (Sophomore)', orderIndex: 1 },
      { questionId: q1.id, optionText: 'Third Year (Junior)', orderIndex: 2 },
      { questionId: q1.id, optionText: 'Fourth Year (Senior)', orderIndex: 3 },
      { questionId: q1.id, optionText: 'Graduate / Postgraduate', orderIndex: 4 }
    ]);

    const q2 = await SurveyQuestion.create({
      surveyId: survey1.id,
      questionText: 'How would you rate the overall reliability and speed of campus Wi-Fi infrastructure?',
      helpText: 'Rate on a scale from 1 (Very Poor) to 5 (Excellent).',
      questionType: 'rating',
      isRequired: true,
      orderIndex: 1
    });

    const q3 = await SurveyQuestion.create({
      surveyId: survey1.id,
      questionText: 'Which campus academic and recreational facilities do you use on a weekly basis?',
      helpText: 'Check all facilities that apply.',
      questionType: 'multiple_choice',
      isRequired: true,
      orderIndex: 2
    });
    const q3Opts = await SurveyQuestionOption.bulkCreate([
      { questionId: q3.id, optionText: 'Central University Library', orderIndex: 0 },
      { questionId: q3.id, optionText: 'High-Performance Computing Lab', orderIndex: 1 },
      { questionId: q3.id, optionText: 'Campus Fitness & Sports Complex', orderIndex: 2 },
      { questionId: q3.id, optionText: 'Student Innovation Hub / Maker Space', orderIndex: 3 },
      { questionId: q3.id, optionText: 'Dining Commons & Cafeteria', orderIndex: 4 }
    ]);

    const q4 = await SurveyQuestion.create({
      surveyId: survey1.id,
      questionText: 'Have you attended at least one technical workshop or student club event this semester?',
      questionType: 'yes_no',
      isRequired: true,
      orderIndex: 3
    });

    const q5 = await SurveyQuestion.create({
      surveyId: survey1.id,
      questionText: 'What is your primary academic major or field of specialization?',
      helpText: 'e.g. Computer Science, Mechanical Engineering, Data Science, Economics',
      questionType: 'short_text',
      isRequired: true,
      orderIndex: 4
    });

    const q6 = await SurveyQuestion.create({
      surveyId: survey1.id,
      questionText: 'What specific enhancement would most improve your daily learning environment?',
      helpText: 'Provide detailed feedback or suggestions for faculty and administrators.',
      questionType: 'long_text',
      isRequired: false,
      orderIndex: 5
    });

    // Sample responses for demonstration
    const sampleResponses = [
      {
        yearOpt: q1Opts[2],
        rating: 4,
        facOpts: [q3Opts[0], q3Opts[1], q3Opts[3]],
        yesNo: true,
        major: 'Computer Science & Engineering',
        feedback: 'Adding more high-power charging outlets at study carrels and extending quiet floor hours during midterms would be immensely beneficial.'
      },
      {
        yearOpt: q1Opts[1],
        rating: 3,
        facOpts: [q3Opts[0], q3Opts[4]],
        yesNo: true,
        major: 'Electrical & Computer Engineering',
        feedback: 'The Wi-Fi drops intermittently in basement lecture halls. Upgrading access points there would solve connectivity issues during exams.'
      },
      {
        yearOpt: q1Opts[3],
        rating: 5,
        facOpts: [q3Opts[0], q3Opts[1], q3Opts[2], q3Opts[3]],
        yesNo: true,
        major: 'Information Technology',
        feedback: 'The newly upgraded cloud GPU access for final year capstone projects has been outstanding. Keep expanding AI compute resources.'
      }
    ];

    for (const respData of sampleResponses) {
      const response = await SurveyResponse.create({
        surveyId: survey1.id,
        sessionId: crypto.randomBytes(16).toString('hex'),
        ipHash: crypto.randomBytes(20).toString('hex')
      });

      const a1 = await SurveyAnswer.create({
        responseId: response.id,
        questionId: q1.id
      });
      await SurveyAnswerSelection.create({
        answerId: a1.id,
        questionOptionId: respData.yearOpt.id
      });

      await SurveyAnswer.create({
        responseId: response.id,
        questionId: q2.id,
        numericValue: respData.rating
      });

      const a3 = await SurveyAnswer.create({
        responseId: response.id,
        questionId: q3.id
      });
      for (const fOpt of respData.facOpts) {
        await SurveyAnswerSelection.create({
          answerId: a3.id,
          questionOptionId: fOpt.id
        });
      }

      await SurveyAnswer.create({
        responseId: response.id,
        questionId: q4.id,
        booleanValue: respData.yesNo
      });

      await SurveyAnswer.create({
        responseId: response.id,
        questionId: q5.id,
        textValue: respData.major
      });

      await SurveyAnswer.create({
        responseId: response.id,
        questionId: q6.id,
        textValue: respData.feedback
      });
    }
  }

  console.log('[SEED] Safe demonstration seeding complete. No existing tables were dropped or modified.');
}

if (require.main === module) {
  seed()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED ERROR]:', err);
      process.exit(1);
    });
}

module.exports = { seed };
