const fs = require("fs");

let urls = [];

let database = fs.readFileSync(`database.json`);
database = JSON.parse(database);


for(let object of database) {
    urls.push(object.recipeURL);
}

urls = JSON.stringify(urls)
fs.writeFileSync("urls.json", urls)