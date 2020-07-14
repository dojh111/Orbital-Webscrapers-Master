const fs = require("fs");

//Arguments: Ending page, page interval, category name (in camel case)
let endingPage = Number(process.argv[2]);
const interval = Number(process.argv[3]);
const type = process.argv[4];

let database = [];

//Pages that don't fit into intervals
let remainder = endingPage % interval;
endingPage -= remainder;

//Process json files in interval of 10 pages each
for (let i = 1; i < endingPage; i += interval) {
  let data = fs.readFileSync(`./${type}/${type}_${i}_to_${i + interval - 1}.json`);
  data = JSON.parse(data);
  database.push(...data);
}

//Process remainder json file
if (remainder !== 0) {
  let data = fs.readFileSync(`./${type}/${type}_${endingPage + 1}_to_${endingPage + remainder}.json`);
  data = JSON.parse(data);
  database.push(...data);
}

for (let i = 0; i < database.length; i++) {
  database[i].id = i;
}

database = JSON.stringify(database, null, 2);
fs.writeFileSync(`./${type}/${type}Database.json`, database);
