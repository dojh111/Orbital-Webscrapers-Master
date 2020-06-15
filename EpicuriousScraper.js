const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

//Library for all the keyterms
const cookingUnits = ["teaspoon", "tablespoon", "cup", "quart", "ounce", "pound", "dash", "pinch", "clove", "gram", "kilogram", "slice", "piece", "head",
    "container", "bottle", "fillet", "package", "envelope", "sprig", "pint"];
const specificUnits = ["can", "cans", "ear", "ears", "large", "small", "medium", "lb", "lbs", "lb.", "lbs.", "bag", "bags", "Tbsp", "Tbsp.", "tsp", "tsp.", "tbsp",
    "tbsp.", "Tsp", "tsp.", "oz.", "oz", "g", "kg"];
//Stores all the text that is to be removed
const extraText = ["of", "to", "taste", "grated", "ground", "eaches", "grounded", "chopped", "sliced", "diced", "very", "ripe", "fresh", "freshly", "coarse", "coarsely", "for",
    "deep", "frying", "mince", "minced", "peeled", "finely", "crushed", "roughly", "pitted", "shredded", "uncooked", "cut", "into", "bite", "sized", "pieces", "thinly",
    "plus", "seeded", "handful", "a", "A", "knob", "thinly", "handful"];
const specialItems = ["skinless", "boneless", "half and half"];
const fractionTable = [{ id: 189, value: 1 / 2 }, { id: 188, value: 1 / 4 }, { id: 8539, value: 1 / 8 }, { id: 8531, value: 1 / 3 }, { id: 190, value: 3 / 4 },
{ id: 8537, value: 1 / 6 }, { id: 8532, value: 2 / 3 }];
const wholeFractionTable = [{ id: "1/2", value: 1 / 2 }, { id: "1/4", value: 1 / 4 }, { id: "1/8", value: 1 / 8 }, { id: "1/3", value: 1 / 3 }, { id: "3/4", value: 3 / 4 },
{ id: "1/6", value: 1 / 6 }, { id: "2/3", value: 2 / 3 }];

let OriginalIngredientArray = [];
let ingredientArray = [];
let extraInfoArray = [];
let prepItemArray = [];

const categories = ["western", "mediterranean", "indian", "chinese", "pizza", "fish and chips"]
const webLink = "https://www.epicurious.com/search/";
const searchLink = "?content=recipe";
const shortLink = "https://www.epicurious.com";

let Recipe = "";
let totalCount = 0;
let finalTotal = 0;
let recipeIndex = 1;
let objectCount = 0;

let ingredientCheck = 0;
let failIngredient = 0;

//Stored Data: ID, Names, URLs, Ingredients
let scrapedDataOBJ = {
    data: []
};
//Stored Data: URL, Prep instructions and Additional Info
let scrapedAdditional = {
    data: []
}

const webScraper = async () => {
    console.log('Starting webscraping');

    //Loop through categories
    for (const item of categories) {
        try {
            const response = await got(webLink + item + searchLink);
            const $ = cheerio.load(response.body);

            let categoryName = item.toUpperCase();

            console.log('---------------------------------' + categoryName + '---------------------------------');

            $('.recipe-content-card').each((i, articles) => {
                //URL page to individual recipe
                const newRecipe = $(articles).find('.photo-link').attr('href');
                //Name of Recipe
                const recipeName = $(articles).find('.photo-link').attr('aria-label');

                //Ratings and Number
                const rating = $(articles).find('.recipes-ratings-summary').attr('data-reviews-rating');
                const reviewNumber = $(articles).find('.recipes-ratings-summary').attr('data-reviews-count');

                if (newRecipe !== Recipe) {
                    Recipe = newRecipe;
                    let fullLink = shortLink + Recipe;
                    //Clear failed links
                    if (fullLink !== 'https://www.epicurious.comundefined') {
                        //Push successful objects into array
                        scrapedDataOBJ.data.push({ id: finalTotal, name: recipeName, ratings: rating, reviewCount: reviewNumber, recipeURL: fullLink });
                        scrapedAdditional.data.push({ id: finalTotal, recipeURL: fullLink });
                        totalCount++;
                        finalTotal++;
                    }
                }
            });

            console.log('');
            console.log('Total Recipes: ' + totalCount);
            console.log('-------------------------------' + 'END OF SECTION' + '-------------------------------')
            console.log('');
            totalCount = 0;
        } catch (error) {
            console.log('Error: ', error);
        }
    }
    console.log('Total: ' + finalTotal);
    console.log('');
    console.log('Starting Ingriedient Scrape');

    let loadCount = 1;

    //Scrape Ingredients
    for (let recipe of scrapedDataOBJ.data) {
        let url = recipe.recipeURL;

        console.log('Start ingriedient load: ' + url);
        console.log('Scraping Item ' + loadCount + ' of ' + finalTotal);
        try {
            const response = await got(url);
            const $ = cheerio.load(response.body);

            console.log('Loaded Successfully');
            console.log('---------------------------------' + 'Recipe' + '---------------------------------');

            $('.ingredients li').each((i, article) => {
                let indexArray = [];
                let recipeUnit = 'No Unit';
                let recipeQuantity = '';
                let rangeFlag = false;

                let item = $(article).text();

                //Trim the string
                item = item.trim();
                //Store original unaltered ingredient list
                OriginalIngredientArray.push(item);

                //Special Items
                for (let j = 0; j < specialItems.length; j++) {
                    if (item.includes(specialItems[j])) {
                        if ((specialItems[j] === "skinless") || (specialItems[j] === "boneless")) {
                            item = item.replace(",", " ");
                            break;
                        } else if (specialItems[j] === "half and half") {
                            item = item.replace("half and half", "half&half");
                        }
                    }
                }

                //GO THROUGH ALL FOR EPICURIOUS
                item = item.split(',', 1);
                item = item[0].split('and/or', 1);
                item = item[0].split('containing', 1);
                item = item[0].split(' ');
                for (let i = 0; i < item.length; i++) {
                    item[i] = item[i].replace("–", " ");
                    rangeFlag = true;
                }

                //Find index of items with () to remove
                for (let j = 0; j < item.length; j++) {
                    let newObject = { toDelete: '', startIndex: '' };
                    let foundFlag = false;
                    if (item[j].indexOf('(') !== -1) {
                        for (let k = j; k < item.length; k++) {
                            if (item[k].indexOf(')') !== -1) {
                                newObject.toDelete = (k - j) + 1;
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
                    if (item[j] === '') {
                        item.splice(j, 1);
                    } else {
                        for (let k = 0; k < extraText.length; k++) {
                            if (item[j] === extraText[k]) {
                                item.splice(j, 1);
                            }
                        }
                    }
                    //Remove all parts after 'Or'
                    if (item[j] === 'or') {
                        item.splice(j, item.length - j);
                    }
                }

                //If after clean up item length is < 1, skip all these parts
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
                    //Get ingredient quantity
                    let deleteValues = [];
                    if (rangeFlag === true && item[0].includes(" ")) {
                        item[0] = item[0].split(" ", 1);
                        recipeQuantity = item[0][0];
                        item[0].splice(0, 1);
                    }
                    for (let j = 0; j < item.length; j++) {
                        let numberFlag = false;
                        let numberItem = Number(item[j])
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
                            if (numberFlag === true) { continue };
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
                        if (numberFlag === true) { continue };
                        let finalCheck = Number(item[j][0])
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
                if (item.includes('And')) {
                    item = item.split('And');
                    for (let j = 0; j < item.length; j++) {
                        item[j] = item[j].trim();
                        let ingredientObject = { name: item[j], amount: recipeQuantity, unit: recipeUnit }

                        //Ingredient check
                        if (ingredientObject.name === '') {
                            failIngredient++
                        }
                        ingredientCheck++;

                        ingredientArray.push(ingredientObject);
                    }
                } else {
                    let ingredientObject = { name: item, amount: recipeQuantity, unit: recipeUnit };
                    //Ingredient check
                    if (ingredientObject.name === '') {
                        failIngredient++
                    }
                    ingredientCheck++;
                    ingredientArray.push(ingredientObject);
                }
            })
            console.log("Getting Additional Info...");
            //Scrape Additional Info
            $('.summary-data dt').each((j, extraInfoHeading) => {
                let infoHeading = $(extraInfoHeading).text();
                infoHeading = infoHeading.trim();

                let infoObject = { heading: infoHeading };
                extraInfoArray.push(infoObject);
            })
            $('.summary-data dd').each((j, extraInfoBody) => {
                let infoBody = $(extraInfoBody).text();
                infoBody = infoBody.trim();
                extraInfoArray[objectCount].body = infoBody;
                objectCount++;
            })
            console.log("Done");
            console.log("Getting Prep Instructions...");
            //Scrape Prep Instructions
            $('.preparation-steps li').each((j, prepItem) => {
                let instructions = $(prepItem).text();
                instructions = instructions.trim();
                let prepObject = { step: recipeIndex, instruction: instructions };
                prepItemArray.push(prepObject);
                recipeIndex++;
            })
            //Scrape Image URL
            let imageURL = $('.photo-wrap').find('img').attr('srcset');
            console.log("Done");
            console.log(ingredientArray);
            console.log('---------------------------------' + 'End' + '---------------------------------');
            //Adding onto object
            recipe.ingredient = ingredientArray;
            recipe.originalIngredient = OriginalIngredientArray;
            recipe.recipeImageURL = imageURL;
            scrapedAdditional.data[recipe.id].additionalInfo = extraInfoArray;
            scrapedAdditional.data[recipe.id].prepInstructions = prepItemArray;
            //Reset Temp Variables
            OriginalIngredientArray = [];
            ingredientArray = [];
            extraInfoArray = [];
            prepItemArray = [];
            recipeIndex = 1;
            loadCount++;
            objectCount = 0;
        }
        catch (error) {
            console.log('Error: ', error);
        }
    }

    console.log('Load count: ' + loadCount + 'out of ' + finalTotal);
    console.log(failIngredient + 'failed out of' + ingredientCheck);

    //Initialise and write to JSON files
    console.log("Write Start File 1")
    let jsonInitialise = JSON.stringify(scrapedDataOBJ);
    fs.writeFile('EpicuriousScraped.json', jsonInitialise, () => { console.log("Write Done") });

    console.log("Write Start File 2")
    let jsonInitialiseTwo = JSON.stringify(scrapedAdditional);
    fs.writeFile('EpicuriousAdditional.json', jsonInitialiseTwo, () => { console.log("Write Done") });
}
webScraper();