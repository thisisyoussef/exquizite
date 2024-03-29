const extract = require('pdf-extraction');
const mammoth = require('mammoth');
const fs = require('fs');
const xlsx = require('xlsx');
const officeParser = require('officeparser');


async function getTextFromFile(file) {
  //input is an object with fileName, buffer, and mimeType
  let extension = file.originalname.split('.').pop();
  let data = file.buffer;
  console.log("extension: ", extension);
  switch (extension) {
    case 'pdf':
      text = await getTextFromPDF(data);
      break;
    case 'doc':
    case 'docx':
    case 'odt':
      text = await getTextFromDoc(data);
      break;
    case 'txt':
      text = await getTextFromTxt(data);
      break;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      text = await getTextFromVideo(data);
      break;
    case 'mp3':
    case 'wav':
    case 'aac':
    case 'flac':
      text = await getTextFromAudio(data);
      break;
    case 'ppt':
    case 'pptx':
    case 'pps':
    case 'ppsx':
      text = await getTextFromPresentation(data);
      break;
    case 'xls':
    case 'xlsx':
    case 'ods':
    case 'csv':
    case 'tsv':
      text = await getTextFromSpreadsheet(data);
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      text = await getTextFromImage(data);
      break;
    default:
      throw new Error('Unsupported file type.');
  }
  return text;
}

async function getTextFromPDF(file) {
  var data;
  data = await extract(file, (err, data) => {
    if (err) {
      console.error('Error extracting text from PDF:', err);
      throw new Error('Error extracting text from PDF.');
    }
    return data;
  });
  var text = data.text;
  return text;
}

async function getTextFromDoc(file) {
  const result = await mammoth.extractRawText({path: file.path});
  return result.value;
}

async function getTextFromTxt(file) {
  const data = fs.readFileSync(file.path, 'utf8');
  return data;
}

async function getTextFromVideo(file) {
  // TODO: Implement getTextFromVideo function
  throw new Error('getTextFromVideo function not implemented.');
}

async function getTextFromAudio(file) {
  // TODO: Implement getTextFromAudio function
  throw new Error('getTextFromAudio function not implemented.');
}

async function getTextFromPresentation(file) {
  const result = await mammoth.extractRawText({path: file.path});
  return result.value;
}

async function getTextFromSpreadsheet(file) {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, {header:1, blankrows:false});
  const text = data.map(row => row.join(' ')).join('\n');
  return text;
}

async function getTextFromImage(file) {
  // TODO: Implement getTextFromImage function
  throw new Error('getTextFromImage function not implemented.');
}

module.exports = { getTextFromFile: getTextFromFile };