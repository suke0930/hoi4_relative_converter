import * as fs from "fs";
const inputCode: string = fs.readFileSync("./test_file.txt").toString();

console.log(inputCode.split("\n"));