const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const defaultNumberOfQuestions = 1;

//MCQ Prompt
function generateMCQPrompt(prompt, numQuestions) {
  if (numQuestions === undefined) {
    numQuestions = defaultNumberOfQuestions;
  }
  //  Generate ${numQuestions} multiple choice questions about the prompt in the following format as a JSON Object:
  return `
  Prompt: ${prompt}
  Generate a multiple choice question about the prompt in the following format as a JSON Object:
  
  {
        "question": "Question",
        "options": ["A", "B", "C", "D"],
        "answer": "Answer"
  }`;
}

//MCQ Completion
async function TextCompletion(prompt, numQuestions) {
  try{
  const promptText = generateMCQPrompt(prompt, numQuestions);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: promptText,
    max_tokens: 1000,
    temperature: 0.6,
    // topP: 1,
    // presencePenalty: 0,
    // frequencyPenalty: 0,
    // bestOf: 1,
    // n: 1,
    // stream: false,
    // stop: ["\n"],
  });
    return response.data.choices[0].text;
}catch(e){
  console.log(e);
}
}

//Clean response 
function cleanResponse(response) {
  cleanedResponse = response.replaceAll(
    /(\r\n|\n|\r)/gm,
    ""
  );
  cleanedResponse = cleanedResponse.replaceAll("\n", "");
  return cleanedResponse;
}

//Parse response
function parseResponse(cleanedResponse) {
  return JSON.parse(cleanedResponse);
}
//Generate MCQ
async function generateMCQ(prompt, numQuestions) {
  const response = await TextCompletion(prompt, numQuestions);
  const cleanedResponse = cleanResponse(response);
  const parsedResponse = parseResponse(cleanedResponse);
  return parsedResponse;
}

module.exports = generateMCQ;