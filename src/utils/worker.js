// worker.js
const generateMCQ = require('../functions/MCQ'); // Import the generateMCQ function

// Define the logic for the background task
const generateMCQInBackground = async (text, numQuestions) => {
  try {
    const response = await generateMCQ(text, numQuestions);
    // Process the response as needed
  } catch (error) {
    // Handle any errors that occur during the task
  }
};

// Run the background task
generateMCQInBackground(process.argv[2], process.argv[3]);
