const fs = require("fs");

let database = fs.readFileSync(`database.json`);
database = JSON.parse(database);

for (let i = database.length - 1; i >= 0; i--) {
  if (database[i].reviewCount < 25) {
    database.splice(i, 1);
  }
}

for (let i = 0; i < database.length; i++) {
  database[i].id = i;
}

database = JSON.stringify(database, null, 2);
fs.writeFileSync(`database.json`, database);
