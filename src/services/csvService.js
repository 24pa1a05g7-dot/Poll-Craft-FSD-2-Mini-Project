const {
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyAnswer,
  SurveyQuestionOption,
  User
} = require('../models');

class CsvService {
  /**
   * Sanitizes and escapes a cell value for RFC 4180 compliance
   * and mitigates CSV Formula Injection (DDE injection).
   */
  static escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    
    let stringVal = String(val).trim();

    // Prevent CSV Formula Injection: if a cell begins with formula trigger characters,
    // prepend a single quote to force spreadsheet programs (Excel, Calc) to treat it as plain text.
    if (/^[=+\-@\t\r]/.test(stringVal)) {
      stringVal = "'" + stringVal;
    }

    // Double all internal quotes and wrap in quotes
    return `"${stringVal.replace(/"/g, '""')}"`;
  }

  static async generateSurveyCsv(surveyId) {
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: SurveyQuestion,
          as: 'questions',
          include: [{ model: SurveyQuestionOption, as: 'options' }]
        }
      ],
      order: [
        [{ model: SurveyQuestion, as: 'questions' }, 'orderIndex', 'ASC']
      ]
    });

    if (!survey) {
      throw new Error('Survey not found.');
    }

    const responses = await SurveyResponse.findAll({
      where: { surveyId },
      include: [
        { model: User, as: 'respondent', attributes: ['id', 'name', 'email'] },
        {
          model: SurveyAnswer,
          as: 'answers',
          include: [
            {
              model: SurveyQuestionOption,
              as: 'selectedOptions'
            }
          ]
        }
      ],
      order: [['submittedAt', 'ASC']]
    });

    const questions = survey.questions || [];

    // Construct Header row
    const headers = [
      'Response ID',
      'Submission Timestamp',
      'Respondent Name',
      'Respondent Email',
      ...questions.map(q => `Q${q.orderIndex + 1}: ${q.questionText}`)
    ];

    const rows = [headers.map(this.escapeCsvCell).join(',')];

    if (responses.length === 0) {
      return rows.join('\r\n');
    }

    // Build data rows
    for (const resp of responses) {
      const row = [
        resp.id,
        resp.submittedAt ? new Date(resp.submittedAt).toISOString() : '',
        resp.respondent ? resp.respondent.name : 'Anonymous Respondent',
        resp.respondent ? resp.respondent.email : 'N/A'
      ];

      for (const q of questions) {
        const ans = resp.answers?.find(a => a.questionId === q.id);
        if (!ans) {
          row.push('');
          continue;
        }

        if (q.questionType === 'rating') {
          row.push(ans.numericValue !== null ? ans.numericValue : '');
        } else if (q.questionType === 'yes_no') {
          row.push(ans.booleanValue !== null ? (ans.booleanValue ? 'Yes' : 'No') : '');
        } else if (q.questionType === 'short_text' || q.questionType === 'long_text') {
          row.push(ans.textValue || '');
        } else if (['single_choice', 'multiple_choice'].includes(q.questionType)) {
          const selectedText = (ans.selectedOptions || []).map(o => o.optionText).join('; ');
          row.push(selectedText);
        } else {
          row.push('');
        }
      }

      rows.push(row.map(this.escapeCsvCell).join(','));
    }

    return rows.join('\r\n');
  }
}

module.exports = CsvService;
