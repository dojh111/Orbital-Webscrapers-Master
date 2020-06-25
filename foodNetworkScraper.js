const got = require("got");
const cheerio = require("cheerio");
const fs = require("fs");

//Library for all the keyterms
const cookingUnits = [
  "teaspoon",
  "tablespoon",
  "cup",
  "quart",
  "ounce",
  "pound",
  "dash",
  "Dash",
  "pinch",
  "Pinch",
  "clove",
  "gram",
  "kilogram",
  "slice",
  "piece",
  "head",
  "container",
  "bottle",
  "fillet",
  "package",
  "envelope",
  "sprig",
  "pint",
];
const specificUnits = [
  "can",
  "cans",
  "ear",
  "ears",
  "large",
  "small",
  "medium",
  "lb",
  "lbs",
  "lb.",
  "lbs.",
  "bag",
  "bags",
  "Tbsp",
  "Tbsp.",
  "tsp",
  "tsp.",
  "tbsp",
  "tbsp.",
  "Tsp",
  "tsp.",
  "oz.",
  "oz",
  "g",
  "kg",
];
//Stores all the text that is to be removed
const extraText = [
  "of",
  "taste",
  "grated",
  "ground",
  "eaches",
  "grounded",
  "chopped",
  "sliced",
  "diced",
  "very",
  "ripe",
  "fresh",
  "freshly",
  "coarse",
  "coarsely",
  "for",
  "deep",
  "frying",
  "mince",
  "minced",
  "peeled",
  "finely",
  "crushed",
  "roughly",
  "pitted",
  "shredded",
  "uncooked",
  "cut",
  "into",
  "bite",
  "sized",
  "pieces",
  "thinly",
  "seeded",
  "handful",
  "a",
  "A",
  "knob",
  "thinly",
  "handful",
  "such",
  "as",
  "One",
  "deli",
  "bunch",
];
const specialItems = ["skinless", "boneless", "half and half"];
const wholeFractionTable = [
  { id: "1/2", value: 1 / 2 },
  { id: "1/4", value: 1 / 4 },
  { id: "1/8", value: 1 / 8 },
  { id: "1/3", value: 1 / 3 },
  { id: "3/4", value: 3 / 4 },
  { id: "1/6", value: 1 / 6 },
  { id: "2/3", value: 2 / 3 },
];

let OriginalIngredientArray = [];
let ingredientArray = [];
let extraInfoArray = [];
let prepItemArray = [];

const categories = [
  "pizza",
  "western",
  "mediterranean",
  "indian",
  "chinese",
  "malay",
  "fish and chips",
  "pancakes",
  "icecream",
  "pasta",
  "mac-and-cheese",
];
const webLink = "https://www.foodnetwork.com/search/";
const shortLink = "https:";

let Recipe = "";
let totalCount = 0;
let finalTotal = 0;
let recipeIndex = 1;

//Stored Data: ID, Names, URLs, Ingredients
let scrapedDataOBJ = {
  data: [],
};
//Stored Data: URL, Prep instructions and Additional Info
let scrapedAdditional = {
  data: [],
};

const webScraper = async () => {
  console.log("Starting webscraping");

  //Load all pages in parallel
  const loadPage = [];
  for (const item of categories) {
    loadPage.push(got(webLink + item + "-"));
  }
  //Wait for all pages to be loaded
  const responses = await Promise.all(loadPage);

  //Iterator variable for category name
  let i = 0;

  for (const page of responses) {
    try {
      const $ = cheerio.load(page.body);

      let categoryName = categories[i].toUpperCase();

      console.log(
        "---------------------------------" +
          categoryName +
          "---------------------------------"
      );

      $(".o-RecipeResult").each((i, articles) => {
        //URL page to individual recipe
        const newRecipe =
          shortLink +
          $(articles).find(".m-MediaBlock__a-Headline").find("a").attr("href");
        //Name of Recipe
        const recipeName = $(articles)
          .find(".m-MediaBlock__a-HeadlineText")
          .text();
        //URL to image of recipe
        let imageURL = $(articles)
          .find(".m-MediaBlock__m-MediaWrap")
          .find("img")
          .attr("src");
        if (imageURL === "" || imageURL === undefined) {
          imageURL = "No Image Available";
        } else {
          imageURL = shortLink + imageURL;
        }
        //Ratings and Number
        let rawRating = $(articles).find(".gig-rating-stars").attr("title");
        let rating = "";
        if (rawRating !== undefined) {
          rawRating = rawRating.split(" ", 1);
          rating = rawRating[0];
        }

        let rawReview = $(articles).find(".gig-rating-ratingsum").text();
        let reviewNumber = "";
        if (rawReview !== undefined) {
          rawReview = rawReview.split(" ", 1);
          reviewNumber = rawReview[0];
        }

        //Push objects onto temporary Object Arrays
        scrapedDataOBJ.data.push({
          id: finalTotal,
          name: recipeName,
          ratings: rating,
          reviewCount: reviewNumber,
          recipeURL: newRecipe,
          recipeImageURL: imageURL,
        });
        scrapedAdditional.data.push({ id: finalTotal, recipeURL: newRecipe });

        totalCount++;
        finalTotal++;
      });

      console.log("");
      console.log("Total Recipes: " + totalCount);
      console.log(
        "-------------------------------" +
          "END OF SECTION" +
          "-------------------------------"
      );
      console.log("");
      totalCount = 0;
    } catch (error) {
      console.log("Error: ", error);
    }
    i++;
  }
  console.log("Total: " + finalTotal);
  console.log("");
  console.log("Starting Ingriedient Scrape");

  let loadCount = 1;

  //Load all recipe pages in parallel
  const whenRecipeLoad = [];
  for (let recipeCard of scrapedDataOBJ.data) {
    let url = recipeCard.recipeURL;
    whenRecipeLoad.push(got(url));
  }
  const recipePages = await Promise.all(whenRecipeLoad);

  //Once pages loaded, starts craping ingredients and prep methods
  for (let recipe of scrapedDataOBJ.data) {
    let url = recipe.recipeURL;

    console.log("Start ingriedient load: " + url);
    console.log("Scraping Item " + loadCount + " of " + finalTotal);

    try {
      const $ = cheerio.load(recipePages[loadCount - 1].body);

      console.log("Loaded Successfully");
      console.log(
        "---------------------------------" +
          "Recipe" +
          "---------------------------------"
      );
      //Scrape Ingredients
      $(".o-Ingredients__m-Body p").each((i, article) => {
        let indexArray = [];
        let recipeUnit = "";
        let recipeQuantity = 0;
        let rangeFlag = false;

        let item = $(article).text();

        item = item.trim();
        //Store original unaltered ingredient list
        OriginalIngredientArray.push(item);

        //Special Items
        for (let j = 0; j < specialItems.length; j++) {
          if (item.includes(specialItems[j])) {
            if (
              specialItems[j] === "skinless" ||
              specialItems[j] === "boneless"
            ) {
              item = item.replace(",", " ");
              break;
            }
          }
        }
        if (item.includes("half-and-half")) {
          item = item.replace("half-and-half", "half&half");
        }
        //Replacing dashes
        if (item.includes("-")) {
          item = item.replace("-", " ");
        }
        item = item.split(",", 1);
        item = item[0].split("and/or", 1);
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
        //Ranged values
        for (let j = item.length; j >= 0; j--) {
          if (item[j] === "to" || item[j] === "plus") {
            item.splice(j, 2);
            rangeFlag = true;
            break;
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
        //Skip if item length is only 1
        if (item.length > 1) {
          //Determine units of ingredient
          for (let k = 0; k < item.length; k++) {
            for (let j = 0; j < cookingUnits.length; j++) {
              if (item[k].includes(cookingUnits[j])) {
                recipeUnit = cookingUnits[j];
                item.splice(k, 1);
                break;
              } else {
                for (let j = 0; j < specificUnits.length; j++) {
                  if (item[k] === specificUnits[j]) {
                    recipeUnit = specificUnits[j];
                    item.splice(k, 1);
                    break;
                  }
                }
              }
            }
          }
          //Clean any additional units
          for (let k = 0; k < item.length; k++) {
            for (let j = 0; j < cookingUnits.length; j++) {
              if (item[k].includes(cookingUnits[j])) {
                item.splice(k, 1);
                break;
              } else {
                for (let j = 0; j < specificUnits.length; j++) {
                  if (item[k] === specificUnits[j]) {
                    item.splice(k, 1);
                    break;
                  }
                }
              }
            }
          }

          let deleteArray = [];
          //Handle Quantity of ingredients
          for (let j = 0; j < item.length; j++) {
            let numberItem = Number(item[j]);
            if (Number.isNaN(numberItem) === false) {
              recipeQuantity += numberItem;
              deleteArray.push(j);
            } else {
              for (let k = 0; k < wholeFractionTable.length; k++) {
                if (item[j] === wholeFractionTable[k].id) {
                  recipeQuantity += wholeFractionTable[k].value;
                  deleteArray.push(j);
                }
              }
            }
          }
          //Clear all values
          for (let j = deleteArray.length - 1; j >= 0; j--) {
            item.splice(deleteArray[j], 1);
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
        }
      });
      console.log("Getting Additional Info...");
      //Scrape Additional Info
      $(".o-RecipeInfo li").each((j, extraInfo) => {
        let infoHeading = $(extraInfo).find(".o-RecipeInfo__a-Headline").text();
        infoHeading = infoHeading.trim();
        let infoBody = $(extraInfo).find(".o-RecipeInfo__a-Description").text();
        infoBody = infoBody.trim();
        let infoObject = { heading: infoHeading, body: infoBody };
        extraInfoArray.push(infoObject);
      });
      console.log("Done");
      console.log("Getting Prep Instructions...");
      //Scrape Prep Instructions
      $(".o-Method__m-Body li").each((j, prepItem) => {
        let instructions = $(prepItem).text();
        instructions = instructions.trim();
        let prepObject = { step: recipeIndex, instruction: instructions };
        prepItemArray.push(prepObject);
        recipeIndex++;
      });
      let arrayLength = extraInfoArray.length;
      extraInfoArray.splice(0, arrayLength / 2);

      console.log(ingredientArray);

      console.log(
        "---------------------------------" +
          "End" +
          "---------------------------------"
      );
      //Adding onto object
      recipe.ingredient = ingredientArray;
      recipe.originalIngredient = OriginalIngredientArray;
      scrapedAdditional.data[recipe.id].additionalInfo = extraInfoArray;
      scrapedAdditional.data[recipe.id].prepInstructions = prepItemArray;
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
  }
  //Initialise and write to JSON files
  console.log("Write Start File 1");
  let jsonInitialise = JSON.stringify(scrapedDataOBJ);
  fs.writeFile("foodNetwork.json", jsonInitialise, () => {
    console.log("Write Done");
  });

  console.log("Write Start File 2");
  let jsonInitialiseTwo = JSON.stringify(scrapedAdditional);
  fs.writeFile("foodNetworkAdditional.json", jsonInitialiseTwo, () => {
    console.log("Write Done");
  });
};
webScraper();
