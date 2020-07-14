const got = require("got");
const cheerio = require("cheerio");
const fs = require("fs");
const keywords = require("../../scraper_keywords/keywords");

//Library for all the keyterms
const cookingUnits = keywords.cookingUnits;
const specificUnits = keywords.specificUnits;
//Stores all the text that is to be removed
const extraText = keywords.extraText;
const specialItems = keywords.specialItems;
const fractionTable = keywords.fractionTable;

//Arguments: Ending page, page interval, category name (in camel case)
let endingPage = Number(process.argv[2]);
const interval = Number(process.argv[3]);
const type = process.argv[4];

let database = [];

let OriginalIngredientArray = [];
let ingredientArray = [];
let extraInfoArray = [];
let prepItemArray = [];
let instructionsIndex = 1;

//Pages that don't fit into intervals
let remainder = endingPage % interval;
endingPage -= remainder;

// //Process remainder json file
// if (remainder !== 0) {
//   let data = fs.readFileSync(`./${type}/${type}_${endingPage + 1}_to_${endingPage + remainder}.json`);
//   data = JSON.parse(data);
//   database.push(...data);
// }

// for (let i = 0; i < database.length; i++) {
//   database[i].id = i;
// }

// database = JSON.stringify(database, null, 2);
// fs.writeFileSync(`./${type}/${type}Database.json`, database);

// const textParser = (item) => {
//   let indexArray = [];
//   let recipeUnit = "";
//   let recipeQuantity = 0;
//   let rangeFlag = false;

//   //Trim the string
//   item = item.trim();
//   //Store original unaltered ingredient list
//   OriginalIngredientArray.push(item);

//   //Special Items
//   for (let j = 0; j < specialItems.length; j++) {
//     if (item.includes(specialItems[j])) {
//       if (
//         specialItems[j] === "skinless" ||
//         specialItems[j] === "boneless" ||
//         specialItems[j] === "large,"
//       ) {
//         item = item.replace(",", " ");
//         break;
//       } else if (
//         specialItems[j] === "half and half" ||
//         specialItems[j] === "half-and-half"
//       ) {
//         item = item.replace(specialItems[j], "half&half");
//       }
//     }
//   }

//   //GO THROUGH ALL FOR EPICURIOUS
//   item = item.split(",", 1);
//   item = item[0].split("and/or", 1);
//   item = item[0].split("containing", 1);
//   item = item[0].split(" ");
//   for (let i = 0; i < item.length; i++) {
//     if (item[i].includes("-")) {
//       item[i] = item[i].replace("–", " ");
//       rangeFlag = true;
//     }
//   }

//   //Find index of items with () to remove
//   for (let j = 0; j < item.length; j++) {
//     let newObject = { toDelete: "", startIndex: "" };
//     let foundFlag = false;
//     if (item[j].indexOf("(") !== -1) {
//       for (let k = j; k < item.length; k++) {
//         if (item[k].indexOf(")") !== -1) {
//           newObject.toDelete = k - j + 1;
//           newObject.startIndex = j;
//           indexArray.push(newObject);
//           foundFlag = true;
//           break;
//         }
//       }
//       if (foundFlag === false) {
//         newObject.toDelete = item.length - j;
//         newObject.startIndex = j;
//         indexArray.push(newObject);
//       }
//     }
//   }
//   //Remove all items with ()
//   if (indexArray.length > 0) {
//     for (let j = indexArray.length - 1; j >= 0; j--) {
//       item.splice(indexArray[j].startIndex, indexArray[j].toDelete);
//     }
//   }

//   //Clean up extra whitespace generated and extra text
//   for (let j = item.length; j >= 0; j--) {
//     if (item[j] === "") {
//       item.splice(j, 1);
//     } else {
//       for (let k = 0; k < extraText.length; k++) {
//         if (item[j] === extraText[k]) {
//           item.splice(j, 1);
//         }
//       }
//     }
//     //Remove all parts after 'Or'
//     if (item[j] === "or") {
//       item.splice(j, item.length - j);
//     }
//   }
//   //If after clean up item length is < 1, skip all these parts
//   if (item.length > 1) {
//     for (let i = item.length - 1; i >= 0; i--) {
//       //Determine units of ingredient
//       for (let j = 0; j < cookingUnits.length; j++) {
//         if (item[i].includes(cookingUnits[j])) {
//           recipeUnit = cookingUnits[j];
//           item.splice(i, 1);
//           break;
//         }
//       }
//       if (recipeUnit === "") {
//         for (let j = 0; j < specificUnits.length; j++) {
//           if (item[i] === specificUnits[j]) {
//             recipeUnit = specificUnits[j];
//             item.splice(i, 1);
//             break;
//           }
//         }
//       }
//     }
//     //Get ingredient quantity
//     let deleteValues = [];
//     if (rangeFlag === true && item[0].includes(" ")) {
//       item[0] = item[0].split(" ", 1);
//       recipeQuantity = item[0][0];
//       item[0].splice(0, 1);
//     }
//     for (let j = 0; j < item.length; j++) {
//       let numberFlag = false;
//       let numberItem = Number(item[j]);
//       if (Number.isNaN(numberItem) === false) {
//         if (rangeFlag === true) {
//           recipeQuantity = numberItem;
//           deleteValues.push(j);
//           continue;
//         } else {
//           recipeQuantity += numberItem;
//           deleteValues.push(j);
//           continue;
//         }
//       } else {
//         //Number is not a number, can be fraction, string fraction or string
//         //Check if number is a fraction
//         for (let k = 0; k < wholeFractionTable.length; k++) {
//           if (item[j] === wholeFractionTable[k].id) {
//             //Check for whole fraction value
//             if (rangeFlag === true) {
//               recipeQuantity = wholeFractionTable[k].value;
//               deleteValues.push(j);
//               numberFlag = true;
//               break;
//             } else {
//               recipeQuantity += wholeFractionTable[k].value;
//               deleteValues.push(j);
//               numberFlag = true;
//               break;
//             }
//           }
//         }
//         if (numberFlag === true) {
//           continue;
//         }
//         let indexCode = item[j].charCodeAt(0);
//         for (let k = 0; k < fractionTable.length; k++) {
//           if (indexCode === fractionTable[k].id) {
//             if (rangeFlag === true) {
//               recipeQuantity = fractionTable[k].value;
//               deleteValues.push(j);
//               numberFlag = true;
//               break;
//             } else {
//               recipeQuantity += fractionTable[k].value;
//               deleteValues.push(j);
//               numberFlag = true;
//               break;
//             }
//           }
//         }
//       }
//       if (numberFlag === true) {
//         continue;
//       }
//       let finalCheck = Number(item[j][0]);
//       if (Number.isNaN(finalCheck) === false) {
//         deleteValues.push(j);
//       }
//     }
//     //Delete All other values
//     for (let j = deleteValues.length - 1; j >= 0; j--) {
//       item.splice(deleteValues[j], 1);
//     }
//   }
//   //Handle Name of Ingredient
//   for (let j = 0; j < item.length; j++) {
//     //Capitalise start of each Name Item
//     item[j] = item[j][0].toUpperCase() + item[j].substr(1);
//   }
//   //Combine back into one single Item
//   item = item.join(" ");

//   //Handling items with 'And' statement
//   if (item.includes("And")) {
//     item = item.split("And");
//     for (let j = 0; j < item.length; j++) {
//       item[j] = item[j].trim();
//       let ingredientObject = {
//         name: item[j],
//         amount: recipeQuantity,
//         unit: recipeUnit,
//       };

//       //Ingredient check
//       if (ingredientObject.name === "") {
//         failIngredient++;
//       }
//       ingredientCheck++;

//       ingredientArray.push(ingredientObject);
//     }
//   } else {
//     let ingredientObject = {
//       name: item,
//       amount: recipeQuantity,
//       unit: recipeUnit,
//     };
//     //Ingredient check
//     if (ingredientObject.name === "") {
//       failIngredient++;
//     }
//     ingredientCheck++;
//     ingredientArray.push(ingredientObject);
//   }
// };

// const scrapeIngredients = async (object) => {
//   try {
//     const page = await got(object.recipeURL);
//     const $ = cheerio.load(page);

//     console.log($(".ingredients-section li"))

//     $(".ingredients-section li").each((i, article) => {
//       let itemText = $(article).find(".ingredients-item-name").text();
//       textParser(itemText);
//     });

//     //Scrape Additional Info
//     $(".recipe-meta-item").each((j, extraInfo) => {
//       let infoHeading = $(extraInfo).find(".recipe-meta-item-header").text();
//       infoHeading = infoHeading.trim();
//       let infoBody = $(extraInfo).find(".recipe-meta-item-body").text();
//       infoBody = infoBody.trim();
//       let infoObject = { heading: infoHeading, body: infoBody };
//       extraInfoArray.push(infoObject);
//     });

//     //Scrape Prep Instructions
//     $(".instructions-section li").each((j, prepItem) => {
//       let instructions = $(prepItem).find("p").text();
//       let prepObject = {
//         step: instructionsIndex,
//         instruction: instructions,
//       };
//       prepItemArray.push(prepObject);
//       instructionsIndex++;
//     });

//     //Adding onto object
//     object.ingredient = ingredientArray;
//     object.originalIngredient = OriginalIngredientArray;
//     object.additionalInfo = extraInfoArray;
//     object.prepInstructions = prepItemArray;
//   } catch (error) {
//     console.log("Error: ", error);
//   }
//   //Reset Temp Variables
//   OriginalIngredientArray = [];
//   ingredientArray = [];
//   extraInfoArray = [];
//   prepItemArray = [];
//   instructionsIndex = 1;
//   return object;
// };

//Process json files in interval of 10 pages each
for (let i = 3601; i < endingPage; i += interval) {
  let data = fs.readFileSync(
    `./${type}/${type}_${i}_to_${i + interval - 1}.json`
  );
  data = JSON.parse(data);

  let j = 0;
  for (let object of data) {
    if (object.ingredient === undefined) {
    console.log(`${object.id} - ${object.name} does not have ingredients`);
    //   scrapeIngredients(object).then((newObject) => {
    //     object = newObject;
    //     // console.log(
    //     //   `New ingredients for recipe ${object.id} is ${object.ingredient}`
    //     // );
    //   });
        for(let k = j; k < data.length - 1; k++) {
            data[k].ingredient = data[k+1].ingredient;
            data[k].originalIngredient = data[k+1].originalIngredient;
            data[k].additionalInfo = data[k+1].additionalInfo;
            data[k].prepInstructions = data[k+1].prepInstructions;
        }
    }
    j++;
  }
  data = JSON.stringify(data, null, 2);
fs.writeFileSync(`./${type}/${i}_to_${i + interval - 1}test.json`, data);
}


