const PDFParser = require("pdf2json");
const fs = require('fs');

const pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    console.log("=== START ===");
    console.log(pdfParser.getRawTextContent());
    console.log("=== END ===");
});

pdfParser.loadPDF("DBMS Project Report Format (1).pdf");
