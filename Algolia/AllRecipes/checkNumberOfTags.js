const fs = require("fs");

//Arguments: name of tag (with first letter capitalized)
let tagName = process.argv[2]

let database = fs.readFileSync(`database.json`);
database = JSON.parse(database);

let numObjectsWithTag = 0;

for(let object of database) {
    if(object.tags.includes(tagName)) {
        numObjectsWithTag++;
    }
}

console.log(`Number of recipes with ${tagName} tag is ${numObjectsWithTag}`)