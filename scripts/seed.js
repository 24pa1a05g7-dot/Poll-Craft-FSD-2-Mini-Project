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
  console.log('[SEED] Starting database seeding...');
  await sequelize.sync({ force: true });
  console.log('[SEED] Cleared existing tables.');

  // 1. Create Users
  const admin = await User.create({
    name: 'Admin Moderator',
    email: 'admin@quickpulse.io',
    password: 'AdminPassword123!',
    role: 'admin',
    isActive: true
  });

  const sarah = await User.create({
    name: 'Prof. Sarah Jenkins',
    email: 'sarah@university.edu',
    password: 'Password123!',
    role: 'user',
    isActive: true
  });

  const alex = await User.create({
    name: 'Alex Rivera',
    email: 'alex@student.org',
    password: 'Password123!',
    role: 'user',
    isActive: true
  });

  const maya = await User.create({
    name: 'Maya Patel',
    email: 'maya@campus.edu',
    password: 'Password123!',
    role: 'user',
    isActive: true
  });

  console.log('[SEED] Seeded 4 demonstration users.');

  // 2. Create Poll 1
  const poll1 = await Poll.create({
    userId: sarah.id,
    title: 'Preferred Primary Language for Modern Web Backends',
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

  // Votes for Poll 1
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

  // Poll 2: Campus Facility Hours
  const poll2 = await Poll.create({
    userId: alex.id,
    title: 'Should the Campus Central Library remain open 24/7 during exam weeks?',
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

  // Poll 3: Closed Poll
  await Poll.create({
    userId: admin.id,
    title: 'Spring Festival 2026 Headliner Genre Selection [Concluded]',
    description: 'This poll has closed. Final genre selections have been forwarded to the student activities board.',
    category: 'Campus Life',
    isMultipleChoice: false,
    isAnonymous: true,
    requireLogin: false,
    isPublic: true,
    status: 'closed',
    slug: 'spring-fest-genre-concluded-' + crypto.randomBytes(3).toString('hex')
  });

  console.log('[SEED] Seeded demonstration polls and votes.');

  // 3. Create Survey 1: Campus Student Experience
  const survey1 = await Survey.create({
    userId: sarah.id,
    title: 'Annual Student Campus Experience & Learning Environment Survey',
    description: 'A comprehensive institutional survey evaluating instructional support, digital learning resources, laboratory facilities, and overall campus wellness.',
    category: 'Academics',
    status: 'published',
    isPublic: true,
    requireLogin: false,
    allowAnonymous: true,
    slug: 'student-campus-experience-2026-' + crypto.randomBytes(3).toString('hex')
  });

  // Questions for Survey 1
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

  // Seed realistic responses for Survey 1
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
    },
    {
      yearOpt: q1Opts[0],
      rating: 4,
      facOpts: [q3Opts[2], q3Opts[4]],
      yesNo: false,
      major: 'Applied Mathematics & Data Science',
      feedback: 'More peer tutoring workshops in linear algebra and discrete structures would assist incoming first-year students.'
    },
    {
      yearOpt: q1Opts[4],
      rating: 4,
      facOpts: [q3Opts[0], q3Opts[1]],
      yesNo: true,
      major: 'Master of Science in Software Engineering',
      feedback: 'Digital access to IEEE Xplore and ACM Digital Library from off-campus VPN is smooth. More quiet study pods in Block B would be great.'
    }
  ];

  for (const respData of sampleResponses) {
    const response = await SurveyResponse.create({
      surveyId: survey1.id,
      sessionId: crypto.randomBytes(16).toString('hex'),
      ipHash: crypto.randomBytes(20).toString('hex')
    });

    // Answer Q1 (single choice)
    const a1 = await SurveyAnswer.create({
      responseId: response.id,
      questionId: q1.id
    });
    await SurveyAnswerSelection.create({
      answerId: a1.id,
      questionOptionId: respData.yearOpt.id
    });

    // Answer Q2 (rating)
    await SurveyAnswer.create({
      responseId: response.id,
      questionId: q2.id,
      numericValue: respData.rating
    });

    // Answer Q3 (multiple choice)
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

    // Answer Q4 (yes_no)
    await SurveyAnswer.create({
      responseId: response.id,
      questionId: q4.id,
      booleanValue: respData.yesNo
    });

    // Answer Q5 (short text)
    await SurveyAnswer.create({
      responseId: response.id,
      questionId: q5.id,
      textValue: respData.major
    });

    // Answer Q6 (long text)
    await SurveyAnswer.create({
      responseId: response.id,
      questionId: q6.id,
      textValue: respData.feedback
    });
  }

  // Survey 2: Tech developer tooling
  const survey2 = await Survey.create({
    userId: maya.id,
    title: 'Developer Ergonomics & Modern Tooling Survey',
    description: 'Evaluating toolchains, IDEs, and workflow satisfaction across student developer teams.',
    category: 'Technology',
    status: 'published',
    isPublic: true,
    requireLogin: false,
    allowAnonymous: true,
    slug: 'dev-tooling-survey-2026-' + crypto.randomBytes(3).toString('hex')
  });

  const sq1 = await SurveyQuestion.create({
    surveyId: survey2.id,
    questionText: 'What is your primary software development operating system?',
    questionType: 'single_choice',
    isRequired: true,
    orderIndex: 0
  });
  await SurveyQuestionOption.bulkCreate([
    { questionId: sq1.id, optionText: 'macOS (Darwin)', orderIndex: 0 },
    { questionId: sq1.id, optionText: 'Linux (Ubuntu / Fedora / Arch)', orderIndex: 1 },
    { questionId: sq1.id, optionText: 'Windows with WSL2', orderIndex: 2 },
    { questionId: sq1.id, optionText: 'Windows Native', orderIndex: 3 }
  ]);

  const sq2 = await SurveyQuestion.create({
    surveyId: survey2.id,
    questionText: 'Rate your satisfaction with your current local continuous development workflow',
    helpText: '1 (Extremely Frustrated) to 5 (Extremely Satisfied)',
    questionType: 'rating',
    isRequired: true,
    orderIndex: 1
  });

  console.log('[SEED] Seeded demonstration surveys, questions, and responses.');
  console.log('[SEED] Seeding successfully completed!');
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
