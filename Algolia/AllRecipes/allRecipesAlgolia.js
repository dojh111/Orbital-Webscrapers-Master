const got = require("got");
const cheerio = require("cheerio");
const fs = require("fs");
const keywords = require("../../scraper_keywords/keywords");

//Library for all the keyterms
const cookingUnits = keywords.cookingUnits;
const specificUnits = keywords.specificUnits
//Stores all the text that is to be removed
const extraText = keywords.extraText
const specialItems = keywords.specialItems;
const fractionTable = keywords.fractionTable;

let OriginalIngredientArray = [];
let ingredientArray = [];
let extraInfoArray = [];
let prepItemArray = [];

const pageLink = "?page=";

let Recipe = "";
let finalTotal = 0;
let instructionsIndex = 1;

//Stored Data: ID, Names, URLs, Ingredients
let scrapedData = [];
//Stored Data: URL, Prep instructions and Additional Info
let scrapedAdditional = {
  data: [],
};

const webScraper = async (pageStart, pageEnd, category, webLink) => {
  scrapedData.splice(0);
  console.log("Start scraping pages " + pageStart + " to " + pageEnd);

  //Load all pages in parallel
  const loadPage = [];
  for (let i = pageStart; i <= pageEnd; i++) {
    if (i === 1) {
      loadPage.push(got(webLink));
    } else {
      loadPage.push(got(webLink + pageLink + i));
    }
  }

  //Wait for all pages to be loaded
  const responses = await Promise.all(loadPage);

  // const responses = [
  //   await got("https://www.allrecipes.com/recipes/?page=3500"),
  // ];

  //Loop through categories

  for (const page of responses) {
    try {
      const $ = cheerio.load(page.body);

      $(".fixed-recipe-card").each((i, articles) => {
        //URL page to individual recipe
        const newRecipe = $(articles)
          .find(".grid-card-image-container")
          .find("a")
          .attr("href");
        //Name of Recipe
        let temprecipeName = $(articles)
          .find(".fixed-recipe-card__img, .ng-isolate-scope")
          .attr("title");
        temprecipeName = temprecipeName.split("Recipe", 1);
        const recipeName = temprecipeName[0];
        //URL to image of recipe
        const imageURL = $(articles)
          .find(".fixed-recipe-card__img, .ng-isolate-scope")
          .attr("data-original-src");
        //Ratings and Number
        const rating = $(articles)
          .find(".stars, .stars-5")
          .attr("data-ratingstars");
        const reviewNumber = $(articles)
          .find(".fixed-recipe-card__reviews")
          .contents()
          .attr("number");

        //Convert ratings into respective class for search ranking purposes
        //Class 10 = 4.5-5 stars, best. Class 0 = 0 star, worst.
        const ratingNumber = Number(rating);
        const ratingClass = Math.ceil(ratingNumber / 0.5);

        //Filter out the videos
        if (newRecipe !== Recipe && !newRecipe.includes("video")) {
          Recipe = newRecipe;
          //Final URL to recipe page
          let fullLink = Recipe;
          //Push objects onto temporary Object Arrays
          scrapedData.push({
            id: finalTotal,
            name: recipeName,
            ratings: rating,
            ratingsClass: ratingClass,
            reviewCount: reviewNumber,
            recipeURL: fullLink,
            recipeImageURL: imageURL,
          });

          finalTotal++;
        }
      });
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

  //Scrape Ingredients
  for (let recipe of scrapedData) {
    let url = recipe.recipeURL;
    try {
      const $ = cheerio.load(recipePages[loadCount - 1].body);

      // console.log("Loaded Successfully");
      // console.log(
      //   "---------------------------------" +
      //     "Recipe" +
      //     "---------------------------------"
      // );

      $(".ingredients-section li").each((i, article) => {
        let itemText = $(article).find(".ingredients-item-name").text();
        textParser(itemText);
      });
      //console.log("Getting Additional Info...");
      //Scrape Additional Info
      $(".recipe-meta-item").each((j, extraInfo) => {
        let infoHeading = $(extraInfo).find(".recipe-meta-item-header").text();
        infoHeading = infoHeading.trim();
        let infoBody = $(extraInfo).find(".recipe-meta-item-body").text();
        infoBody = infoBody.trim();
        let infoObject = { heading: infoHeading, body: infoBody };
        extraInfoArray.push(infoObject);
      });
      //Scrape Prep Instructions
      $(".instructions-section li").each((j, prepItem) => {
        let instructions = $(prepItem).find("p").text();
        let prepObject = { step: instructionsIndex, instruction: instructions };
        prepItemArray.push(prepObject);
        instructionsIndex++;
      });

      //Adding onto object
      recipe.ingredient = ingredientArray;
      recipe.originalIngredient = OriginalIngredientArray;
      recipe.additionalInfo = extraInfoArray;
      recipe.prepInstructions = prepItemArray;

      if (ingredientArray.length === 0) {
        scrapedData.splice(loadCount - 1, 1);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
    //Reset Temp Variables
    OriginalIngredientArray = [];
    ingredientArray = [];
    extraInfoArray = [];
    prepItemArray = [];
    instructionsIndex = 1;
    loadCount++;
  }

  //console.log("Load count: " + loadCount);

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

  // console.log("Write Start File 2");
  // let jsonStringToWriteTwo = JSON.stringify(scrapedAdditional);
  // fs.writeFile("allRecipesAdditional.json", jsonStringToWriteTwo, () => {
  //   console.log("Write Done");
  // });
};

const textParser = (item) => {
  let indexArray = [];
  let recipeUnit = "";
  let recipeQuantity = 0;
  //Trim the string
  item = item.trim();
  //Store original unaltered ingredient list
  OriginalIngredientArray.push(item);

  //Special Items
  for (let j = 0; j < specialItems.length; j++) {
    if (item.includes(specialItems[j])) {
      if (specialItems[j] === "skinless" || specialItems[j] === "boneless") {
        item = item.replace(",", " ");
        break;
      } else if (specialItems[j] === "half and half" || specialItems[j] === "half-and-half") {
        item = item.replace(specialItems[j], "half&half");
      }
    }
  }

  //Replacing dashes
  if (item.includes("-")) {
    item = item.replace("-", " ");
  }
  item = item.split(",", 1);
  item = item[0].split(" ");

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

  //Find index of items with () to remove
  for (let j = 0; j < item.length; j++) {
    let newObject = { toDelete: "", startIndex: "" };
    if (item[j].indexOf("(") !== -1) {
      for (let k = j; k < item.length; k++) {
        if (item[k].indexOf(")") !== -1) {
          newObject.toDelete = k - j + 1;
          newObject.startIndex = j;
          indexArray.push(newObject);
          break;
        }
      }
    }
  }
  //Remove all items with ()
  if (indexArray.length > 0) {
    for (let j = indexArray.length - 1; j >= 0; j--) {
      item.splice(indexArray[j].startIndex, indexArray[j].toDelete);
    }
  }

  //If after clean up item length is < 1, skip all these parts
  if (item.length > 1) {
    //Determine units of ingredient
    for (let j = 0; j < cookingUnits.length; j++) {
      if (item[1].includes(cookingUnits[j])) {
        recipeUnit = cookingUnits[j];
        item.splice(1, 1);
        break;
      }
    }
    if (recipeUnit === "No Unit") {
      for (let j = 0; j < specificUnits.length; j++) {
        if (item[1] === specificUnits[j]) {
          recipeUnit = specificUnits[j];
          item.splice(1, 1);
          break;
        }
      }
    }

    //Get ingredient quantity
    let numberItem = Number(item[0]);
    if (Number.isNaN(numberItem)) {
      let quantity = 0;
      let fractionFlag = false;
      //Handle ingredient with string fractions
      for (let j = 0; j < item[0].length; j++) {
        //Special White Space Character
        if (item[0].charCodeAt(j) === 8201) {
          continue;
        }
        if (item[0].charCodeAt(j) >= 49 && item[0].charCodeAt(j) <= 58) {
          quantity += Number(item[0][j]);
        } else {
          let indexCode = item[0].charCodeAt(j);
          //Converting from HTML element into numbered fraction
          for (let k = 0; k < fractionTable.length; k++) {
            if (indexCode === fractionTable[k].id) {
              quantity += fractionTable[k].value;
              fractionFlag = true;
              break;
            }
          }
        }
      }
      if (fractionFlag === true) {
        recipeQuantity = quantity;
        item.splice(0, 1);
      } else {
        //No Quantity available
        //console.log("Item has no quantities")
        recipeQuantity = 0;
      }
    } else {
      //Number is available
      recipeQuantity = numberItem;
      item.splice(0, 1);
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
      ingredientArray.push(ingredientObject);
    }
  } else {
    let ingredientObject = {
      name: item,
      amount: recipeQuantity,
      unit: recipeUnit,
    };
    ingredientArray.push(ingredientObject);
  }
};

//Run function with node allrecipesScraper.js
//Arguments: page to start at (usually 1), interval between pages (usually 10), number of pages to scrape, category name (in camel case), URL to the category (https://.../.../)
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
    await timeout(10000);
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

module.exports = {textParser}