const fs = require("fs");

let category = process.argv[2];
let path = `./${category}/${category}Database.json`;
category = category[0].toUpperCase() + category.slice(1);

let database = fs.readFileSync(`database.json`);
database = JSON.parse(database);
let urls = [];

database.forEach((object) => {
  if (object.tags === undefined) {
    object.tags = [];
  }
  urls.push(object.recipeURL);
});

let tagsDatabase = fs.readFileSync(path);
tagsDatabase = JSON.parse(tagsDatabase);


for (let object of tagsDatabase) {
  let index = urls.indexOf(object.recipeURL);
  if (index !== -1) {
    database[index].tags.push(category);
  } else {
    object.tags = [];
    object.tags.push(category);
    database.push(object);
  }
}

for (let i = 0; i < database.length; i++) {
  database[i].id = i;
}

database = JSON.stringify(database);
fs.writeFileSync("database.json", database);
