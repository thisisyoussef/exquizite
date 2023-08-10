//A function that scans the material files and updates the material text accordingly using the GetTextFromPDF function.

const Material = require("../models/material");
const getTextFromFile = require("./getTextFromFile");

async function scanMaterialFiles(material) {
    //loop through the files and call getTextFromFile
    //then append the text to the material
    //Delete the old text
    material.text = "";
    for (let i = 0; i < material.files.length; i++) {
            // Extract text from file
            var text = await getTextFromFile.getTextFromFile(material.files[i].buffer);
            //set text to the text field of its object
            if (material.text === undefined) {
                material.text = "";
            }
            //Add a new line to the text before appending the text from the pdf
            material.text += "\n";
            material.text += text;
    }
    await material.save();
    return material;
}

module.exports = { scanMaterialFiles }