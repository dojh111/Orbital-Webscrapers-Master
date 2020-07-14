const fs = require("fs");

//Arguments: category name (in camel case)
let category = process.argv[2];
let path = `./${category}/${category}Database.json`;
category = category[0].toUpperCase() + category.slice(1);

let database = fs.readFileSync(`database.json`);
database = JSON.parse(database);
let urls = [];

database.forEach((object) => {
  //Create empty tags array if it doens't exist
  if (object.tags === undefined) {
    object.tags = [];
  }
  //Generate array of URLs for existing recipes
  urls.push(object.recipeURL);
});

//Get database of recipes in the category
let tagsDatabase = fs.readFileSync(path);
tagsDatabase = JSON.parse(tagsDatabase);

//If recipe already exists, add the category tag
//Else we push the recipe
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

//Generate IDs
for (let i = 0; i < database.length; i++) {
  database[i].id = i;
}

database = JSON.stringify(database, null, 2);
fs.writeFileSync("database.json", database);
