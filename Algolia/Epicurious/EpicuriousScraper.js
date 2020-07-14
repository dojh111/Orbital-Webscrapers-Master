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
const wholeFractionTable = keywords.wholeFractionTable;

let OriginalIngredientArray = [];
let ingredientArray = [];
let extraInfoArray = [];
let prepItemArray = [];

const shortLink = "https://www.epicurious.com";
const pageLink = "&page=";
const mostReviewedLink = "&sort=mostReviewed";

let Recipe = "";
let totalCount = 0;
let finalTotal = 0;
let recipeIndex = 1;
let objectCount = 0;

let ingredientCheck = 0;
let failIngredient = 0;

//Stored Data: ID, Names, URLs, Ingredients
let scrapedData = [];

const webScraper = async (pageStart, pageEnd, category, webLink) => {
  scrapedData.splice(0);
  console.log("Start scraping pages " + pageStart + " to " + pageEnd);

  //Load all pages in parallel
  const loadPage = [];
  for (let i = pageStart; i <= pageEnd; i++) {
    if (i === 1) {
      loadPage.push(got(webLink + mostReviewedLink));
    } else {
      loadPage.push(got(webLink + pageLink + i + mostReviewedLink));
    }
  }

  //Wait for all pages to be loaded
  const responses = await Promise.all(loadPage);

  //Get list of recipes for each category
  for (const page of responses) {
    try {
      const $ = cheerio.load(page.body);

      $(".recipe-content-card").each((i, articles) => {
        //URL page to individual recipe
        const newRecipe = $(articles).find(".photo-link").attr("href");
        //Name of Recipe
        const recipeName = $(articles).find(".photo-link").attr("aria-label");

        //Ratings and Number
        const rating = $(articles)
          .find(".recipes-ratings-summary")
          .attr("data-reviews-rating");
        const reviewNumber = $(articles)
          .find(".recipes-ratings-summary")
          .attr("data-reviews-count");

        //Convert ratings into respective class for search ranking purposes
        //Class 10 = 4.5-5 stars, best. Class 0 = 0 star, worst.
        const ratingNumber = Number(rating);
        const ratingClass = Math.ceil(ratingNumber / 0.4);

        if (newRecipe !== Recipe) {
          Recipe = newRecipe;
          let fullLink = shortLink + Recipe;
          //Clear failed links
          if (fullLink !== "https://www.epicurious.comundefined") {
            //Push successful objects into array
            scrapedData.push({
              id: finalTotal,
              name: recipeName,
              ratings: rating,
              ratingsClass: ratingClass,
              reviewCount: reviewNumber,
              recipeURL: fullLink,
            });
            totalCount++;
            finalTotal++;
          }
        }
      });
      totalCount = 0;
    } catch (error) {
      console.log("Error: ", error);
    }
  }
  console.log("Starting Ingredient Scrape");

  let loadCount = 1;

  //Load all recipe pages in parallel
  const whenRecipeLoad = [];
  for (let recipeCard of scrapedData) {
    let url = recipeCard.recipeURL;
    whenRecipeLoad.push(got(url));
  }
  const recipePages = await Promise.all(whenRecipeLoad);

  //Once pages loaded, starts craping ingredients and prep methods
  for (let recipe of scrapedData) {
    let url = recipe.recipeURL;
    try {
      const $ = cheerio.load(recipePages[loadCount - 1].body);

      $(".ingredients li").each((i, article) => {
        let item = $(article).text();
        textParser(item);
      });

      //Scrape Additional Info
      $(".summary-data dt").each((j, extraInfoHeading) => {
        let infoHeading = $(extraInfoHeading).text();
        infoHeading = infoHeading.trim();

        let infoObject = { heading: infoHeading };
        extraInfoArray.push(infoObject);
      });
      $(".summary-data dd").each((j, extraInfoBody) => {
        let infoBody = $(extraInfoBody).text();
        infoBody = infoBody.trim();
        extraInfoArray[objectCount].body = infoBody;
        objectCount++;
      });

      //Scrape Prep Instructions
      $(".preparation-steps li").each((j, prepItem) => {
        let instructions = $(prepItem).text();
        instructions = instructions.trim();
        let prepObject = { step: recipeIndex, instruction: instructions };
        prepItemArray.push(prepObject);
        recipeIndex++;
      });
      //Scrape Image URL
      let imageURL = $(".photo-wrap").find("img").attr("srcset");

      //Adding onto object
      recipe.ingredient = ingredientArray;
      recipe.originalIngredient = OriginalIngredientArray;
      recipe.recipeImageURL = imageURL;
      recipe.additionalInfo = extraInfoArray;
      recipe.prepInstructions = prepItemArray;
    } catch (error) {
      console.log("Error: ", error);
    }
    //Reset Temp Variables
    OriginalIngredientArray = [];
    ingredientArray = [];
    extraInfoArray = [];
    prepItemArray = [];
    recipeIndex = 1;
    loadCount++;
    objectCount = 0;
  }

  //Initialise and write to JSON files
  console.log(`Start file write for pages ${pageStart} to ${pageEnd}`);
  let jsonStringToWrite = JSON.stringify(scrapedData, null, 2);
  //If folder does not exist, create it
  if (!fs.existsSync(`./${category}`)) {
    fs.mkdirSync(`./${category}`);
  }
  fs.writeFileSync(
    `./${category}/${category}_${pageStart}_to_${pageEnd}.json`,
    jsonStringToWrite
  );
};

const textParser = (item) => {
  let indexArray = [];
  let recipeUnit = "";
  let recipeQuantity = 0;
  let rangeFlag = false;

  //Trim the string
  item = item.trim();
  //Store original unaltered ingredient list
  OriginalIngredientArray.push(item);

  //Special Items
  for (let j = 0; j < specialItems.length; j++) {
    if (item.includes(specialItems[j])) {
      if (
        specialItems[j] === "skinless" ||
        specialItems[j] === "boneless" ||
        specialItems[j] === "large,"
      ) {
        item = item.replace(",", " ");
        break;
      } else if (
        specialItems[j] === "half and half" ||
        specialItems[j] === "half-and-half"
      ) {
        item = item.replace(specialItems[j], "half&half");
      }
    }
  }

  //GO THROUGH ALL FOR EPICURIOUS
  item = item.split(",", 1);
  item = item[0].split("and/or", 1);
  item = item[0].split("containing", 1);
  item = item[0].split(" ");
  for (let i = 0; i < item.length; i++) {
    if (item[i].includes("-")) {
      item[i] = item[i].replace("–", " ");
      rangeFlag = true;
    }
  }

  //Find index of items with () to remove
  for (let j = 0; j < item.length; j++) {
    let newObject = { toDelete: "", startIndex: "" };
    let foundFlag = false;
    if (item[j].indexOf("(") !== -1) {
      for (let k = j; k < item.length; k++) {
        if (item[k].indexOf(")") !== -1) {
          newObject.toDelete = k - j + 1;
          newObject.startIndex = j;
          indexArray.push(newObject);
          foundFlag = true;
          break;
        }
      }
      if (foundFlag === false) {
        newObject.toDelete = item.length - j;
        newObject.startIndex = j;
        indexArray.push(newObject);
      }
    }
  }
  //Remove all items with ()
  if (indexArray.length > 0) {
    for (let j = indexArray.length - 1; j >= 0; j--) {
      item.splice(indexArray[j].startIndex, indexArray[j].toDelete);
    }
  }

  //Clean up extra whitespace generated and extra text
  for (let j = item.length; j >= 0; j--) {
    if (item[j] === "") {
      item.splice(j, 1);
    } else {
      for (let k = 0; k < extraText.length; k++) {
        if (item[j] === extraText[k]) {
          item.splice(j, 1);
        }
      }
    }
    //Remove all parts after 'Or'
    if (item[j] === "or") {
      item.splice(j, item.length - j);
    }
  }
  //If after clean up item length is < 1, skip all these parts
  if (item.length > 1) {
    for (let i = item.length - 1; i >= 0; i--) {
      //Determine units of ingredient
      for (let j = 0; j < cookingUnits.length; j++) {
        if (item[i].includes(cookingUnits[j])) {
          recipeUnit = cookingUnits[j];
          item.splice(i, 1);
          break;
        }
      }
      if (recipeUnit === "") {
        for (let j = 0; j < specificUnits.length; j++) {
          if (item[i] === specificUnits[j]) {
            recipeUnit = specificUnits[j];
            item.splice(i, 1);
            break;
          }
        }
      }
    }
    //Get ingredient quantity
    let deleteValues = [];
    if (rangeFlag === true && item[0].includes(" ")) {
      item[0] = item[0].split(" ", 1);
      recipeQuantity = item[0][0];
      item[0].splice(0, 1);
    }
    for (let j = 0; j < item.length; j++) {
      let numberFlag = false;
      let numberItem = Number(item[j]);
      if (Number.isNaN(numberItem) === false) {
        if (rangeFlag === true) {
          recipeQuantity = numberItem;
          deleteValues.push(j);
          continue;
        } else {
          recipeQuantity += numberItem;
          deleteValues.push(j);
          continue;
        }
      } else {
        //Number is not a number, can be fraction, string fraction or string
        //Check if number is a fraction
        for (let k = 0; k < wholeFractionTable.length; k++) {
          if (item[j] === wholeFractionTable[k].id) {
            //Check for whole fraction value
            if (rangeFlag === true) {
              recipeQuantity = wholeFractionTable[k].value;
              deleteValues.push(j);
              numberFlag = true;
              break;
            } else {
              recipeQuantity += wholeFractionTable[k].value;
              deleteValues.push(j);
              numberFlag = true;
              break;
            }
          }
        }
        if (numberFlag === true) {
          continue;
        }
        let indexCode = item[j].charCodeAt(0);
        for (let k = 0; k < fractionTable.length; k++) {
          if (indexCode === fractionTable[k].id) {
            if (rangeFlag === true) {
              recipeQuantity = fractionTable[k].value;
              deleteValues.push(j);
              numberFlag = true;
              break;
            } else {
              recipeQuantity += fractionTable[k].value;
              deleteValues.push(j);
              numberFlag = true;
              break;
            }
          }
        }
      }
      if (numberFlag === true) {
        continue;
      }
      let finalCheck = Number(item[j][0]);
      if (Number.isNaN(finalCheck) === false) {
        deleteValues.push(j);
      }
    }
    //Delete All other values
    for (let j = deleteValues.length - 1; j >= 0; j--) {
      item.splice(deleteValues[j], 1);
    }
  }
  //Handle Name of Ingredient
  for (let j = 0; j < item.length; j++) {
    //Capitalise start of each Name Item
    item[j] = item[j][0].toUpperCase() + item[j].substr(1);
  }
  //Combine back into one single Item
  item = item.join(" ");

  //Handling items with 'And' statement
  if (item.includes("And")) {
    item = item.split("And");
    for (let j = 0; j < item.length; j++) {
      item[j] = item[j].trim();
      let ingredientObject = {
        name: item[j],
        amount: recipeQuantity,
        unit: recipeUnit,
      };

      //Ingredient check
      if (ingredientObject.name === "") {
        failIngredient++;
      }
      ingredientCheck++;

      ingredientArray.push(ingredientObject);
    }
  } else {
    let ingredientObject = {
      name: item,
      amount: recipeQuantity,
      unit: recipeUnit,
    };
    //Ingredient check
    if (ingredientObject.name === "") {
      failIngredient++;
    }
    ingredientCheck++;
    ingredientArray.push(ingredientObject);
  }
};

//Run function with node allrecipesScraper.js
//Arguments: page to start at (usually 1), interval between pages (usually 10), 
//number of pages to scrape, category name (in camel case), 
//URL to the category (e.g. https://www.epicurious.com/search?content=recipe&meal=breakfast) - omit the page and most reviewed
const scraperInitialize = async (args) => {
  let pageToStart = Number(args[2]);
  let pageInterval = Number(args[3]);
  let numPagesToScrape = Number(args[4]);
  let category = args[5];
  let baseLink = args[6];

  let remainder = numPagesToScrape % pageInterval;
  
  if(remainder !== 0) {
    numPagesToScrape -= remainder;
  }
  let pageToEnd = pageToStart + numPagesToScrape - 1;
  //Scrape intervals
  for (let i = pageToStart; i <= pageToEnd; i += pageInterval) {
    await webScraper(i, i + pageInterval - 1, category, baseLink);
    await timeout(5000);
  }

  //Scrape any remainder
  if(remainder !== 0) {
    await webScraper(pageToEnd + 1, pageToEnd + remainder, category, baseLink);
  }
};

const timeout = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

scraperInitialize(process.argv);
