const fs = require("fs");
const type = "dinner";
const endingPage = 69;

let database = [];

for (let i = 1; i < endingPage; i += 10) {
  let data = i == 61 ? fs.readFileSync(`${type}_${i}_to_${i + 8}.json`) : fs.readFileSync(`${type}_${i}_to_${i + 9}.json`);
  data = JSON.parse(data);
  database.push(...data);
}

for (let i = database.length - 1; i >= 0; i--) {
  if (database[i].reviewCount < 10) {
    database.splice(i, 1);
  }
}

for (let i = 0; i < database.length; i++) {
  database[i].id = i;
}

database = JSON.stringify(database);
fs.writeFileSync(`dinnerDatabase.json`, database);