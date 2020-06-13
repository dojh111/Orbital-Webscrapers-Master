const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

const cookingUnits = ["teaspoon", "tablespoon", "cup", "quart", "ounce", "pound", "lb", "dash", "pinch", "clove", "gram", "kilogram"];
const specificUnits = ["can", "large", "small", "container", "bottle"];
const extraText = ["of", "to", "taste", "grated", "ground", "grounded", "chopped", "sliced", "diced", "very", "ripe", "fresh"]

let ingredientArray = [];

const categories = ["western", "mediterranean", "indian", "chinese", "malay", "fish and chips"]
const webLink = "https://www.allrecipes.com/search/results/?wt=";
const recipeSite = "&sort=re";
const shortLink = "";

let Recipe = "";
let totalCount = 0;
let finalTotal = 0;

//Stored Data
let scrapedDataOBJ = {
    data: []
};

const webScraper = async () => {
    console.log('Starting webscraping');

    //Loop through categories
    for (let item of categories) {
        try {
            const response = await got(webLink + item + recipeSite);
            const $ = cheerio.load(response.body);

            let categoryName = item.toUpperCase();

            console.log('---------------------------------' + categoryName + '---------------------------------');

            $('.fixed-recipe-card').each(async (i, articles) => {
                //URL page to individual recipe
                const newRecipe = $(articles).find('.grid-card-image-container').find('a').attr('href');
                //Name of Recipe
                const recipeName = $(articles).find('.fixed-recipe-card__img, .ng-isolate-scope').attr('title');
                //URL to image of recipe
                const imageURL = $(articles).find('.fixed-recipe-card__img, .ng-isolate-scope').attr('data-original-src');
                //Ratings and Number
                const rating = $(articles).find('.stars, .stars-5').attr('data-ratingstars');
                const reviewNumber = $(articles).find('.fixed-recipe-card__reviews').contents().attr('number');

                //Filter out the videos
                if ((newRecipe !== Recipe) && !(newRecipe.includes('video'))) {
                    Recipe = newRecipe;

                    //Final URL to recipe page
                    let fullLink = shortLink + Recipe;

                    scrapedDataOBJ.data.push({ id: finalTotal, name: recipeName, ratings: rating, reviewCount: reviewNumber, recipeURL: fullLink, recipeImageURL: imageURL });

                    //For Debugging Purposes
                    // console.log('');
                    // console.log(recipeName);
                    // console.log(fullLink);
                    // console.log('ImageURL: ' + imageURL);
                    // console.log('Ratings: ' + rating + '   ' + 'Review Count: ' + reviewNumber);

                    totalCount++;
                    finalTotal++;
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

    console.log('Final Total: ' + finalTotal);
    console.log('');
    console.log('Starting Ingriedient Scrape');

    let loadCount = 0;

    //Scrape Ingriedients
    for (let recipe of scrapedDataOBJ.data) {
        let url = recipe.recipeURL;

        console.log('Start ingriedient load: ' + url);
        try {
            console.log('Loading URL...')
            const response = await got(url);
            const $ = cheerio.load(response.body);

            console.log('Loaded Successfully');
            console.log('---------------------------------' + 'Recipe' + '---------------------------------');

            $('.ingredients-section li').each((i, article) => {
                let indexArray = [];
                let recipeUnit = 'No Unit';
                let recipeQuantity = '';
                let replacementFlag = false;

                let item = $(article).find('.ingredients-item-name').text();

                //Trim the string
                item = item.trim();

                //Remove commas, split items and clean up for processing
                if (item.includes("all-purpose")) {
                    item = item.replace("all-purpose", "APReplace");
                    replacementFlag = true;
                }
                item = item.split('-', 1);
                item = item[0].split(',', 1);
                item = item[0].split(' ');

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
                }

                //Find index of items with () to remove
                for (let j = 0; j < item.length; j++) {
                    let newObject = { toDelete: '', startIndex: '' };
                    if (item[j].indexOf('(') !== -1) {
                        for (let k = j; k < item.length; k++) {
                            if (item[k].indexOf(')') !== -1) {
                                newObject.toDelete = (k - j) + 1;
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

                //Determine units of ingredient
                for (let j = 0; j < cookingUnits.length; j++) {
                    if (item[1].includes(cookingUnits[j])) {
                        recipeUnit = cookingUnits[j];
                        item.splice(1, 1);
                        break;
                    }
                }
                if (recipeUnit === 'No Unit') {
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
                    recipeQuantity = item[0];
                    item.splice(0, 1);
                } else {
                    recipeQuantity = numberItem;
                    item.splice(0, 1);
                }

                //Handle Name of Ingredient
                for (let j = 0; j < item.length; j++) {
                    //Capitalise start of each Name Item
                    item[j] = item[j][0].toUpperCase() + item[j].substr(1);
                }
                //Combine back into one single Item
                item = item.join(" ");

                //Replacing all placeholders from earlier
                if (replacementFlag === true) {
                    item = item.replace("APReplace", "All-Purpose")
                }

                //Handling items with 'And' statement
                if (item.includes('And')) {
                    item = item.split('And');
                    for (let j = 0; j < item.length; j++) {
                        let ingredientObject = { name: item[j], amount: recipeQuantity, unit: recipeUnit }
                        ingredientArray.push(ingredientObject);
                    }
                } else {
                    let ingredientObject = { name: item, amount: recipeQuantity, unit: recipeUnit };
                    ingredientArray.push(ingredientObject);
                }

                //For Debugging purposes
                // console.log(item);
                // console.log('Quantity: ' + recipeQuantity);
                // console.log('Unit: ' + recipeUnit);
                // console.log('');
            })
        } catch (error) {
            console.log('Error: ', error);
        }
        //Append ingriedients to main file here
        console.log(ingredientArray);
        console.log('---------------------------------' + 'End' + '---------------------------------');
        //Clear Array
        ingredientArray = [];
    }

    console.log('Load count: ' + loadCount);

    //Initialise and write to JSON file
    console.log("Write Start")
    let jsonInitialise = JSON.stringify(scrapedDataOBJ);
    fs.writeFile('allRecipesScraped.json', jsonInitialise, () => { console.log("Write Done") });
}

//Run function with node allrecipesScraper.js
webScraper();
