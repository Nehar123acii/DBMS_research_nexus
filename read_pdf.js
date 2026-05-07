const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, 'DBMS Project Report Format (1).pdf');

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log("=== START PDF TEXT ===");
    console.log(data.text);
    console.log("=== END PDF TEXT ===");
}).catch(err => {
    console.error("ERROR READING PDF:", err);
});
