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
  return `
  Prompt: ${prompt}
  Generate ${numQuestions} multiple choice questions about the prompt in the following format as a JSON Object:
  {
    "questions": [
      {
        "question": "Question",
        "options": ["A", "B", "C", "D"],
        "answer": "Answer"
      },
      {
        "question": "Question",
        "options": ["A", "B", "C", "D"],
        "answer": "Answer"
      }
    ]
  }

  Make sure that there is a stem in the question and plausible distractors. 
  Make sure that the distractors are plausible and not too similar to the answer. 
  Make sure that the answer is clear and unambiguous.
  Make sure that the question can be answered by reading the prompt and thinking about it.
  `
  ;
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
  console.log(response.data.choices[0].text);
  return response.data.choices[0].text;
}catch(e){
  console.log(e);
}
}

//MCQ Completion, testing with chat
async function TextCompletionChat(prompt, numQuestions) {
  try{
  const promptText = generateMCQPrompt(prompt, numQuestions);
  console.log("MCQ Prompt with Chat");
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages:[{role:"user", content:promptText,}]
  });
  console.log("MCQ Response");
  console.log(response.data.choices[0].message.content);
  return response.data.choices[0].message.content;
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
  const response = await TextCompletionChat(prompt, numQuestions);
  const cleanedResponse = cleanResponse(response);
  const parsedResponse = parseResponse(cleanedResponse);
  return parsedResponse;
}

module.exports = generateMCQ;