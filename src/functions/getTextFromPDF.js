const extract = require('pdf-extraction');



async function GetTextFromPDF(file) {
    console.log("file: ", file);
    var data;
    data = await extract(file, (err, data) => {
      if (err) {
        console.error('Error extracting text from PDF:', err);
        return res.status(500).json({ error: 'Error extracting text from PDF.' });
      }
      return data;
  });
  var text = data.text;
  return text;
}
module.exports = { GetTextFromPDF }