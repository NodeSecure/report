"use strict";

const { join } = require("path");

const { generatePDF } = require("./src/pdf");

generatePDF(join(__dirname, "/views/index.html"))
    .then(() => console.log("report generated!"))
    .catch(console.error);
