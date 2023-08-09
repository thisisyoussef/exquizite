const generateMCQ = require('./MCQ.js');
const Assessment = require('../../src/models/assessment');
const Question = require('../../src/models/question');


const processAssessment = async (text, numQuestions, userId, assessmentName) => {
    try {
      const response = await generateMCQ(text, numQuestions);
      const questions = [];
      for (let i = 0; i < response.questions.length; i++) {
        const question = new Question({
          question: response.questions[i].question,
          options: response.questions[i].options,
          answer: response.questions[i].answer,
          createdBy: userId,
        });
        await question.save();
        questions.push(question);
      }
      const assessment = new Assessment({
        name: assessmentName,
        createdBy: userId,
        questions: questions,
        topic: topicId,
      });
      await assessment.save();
      console.log('Assessment created:', assessment);
      return assessment;
    } catch (error) {
      console.error('Error generating assessment:', error);
      return error;
    }
  };

module.exports = processAssessment;