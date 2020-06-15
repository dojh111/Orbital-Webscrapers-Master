const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const { clear } = require('console');

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

let OriginalIngredientArray = [];
let ingredientArray = [];
let extraInfoArray = [];
let prepItemArray = [];

const categories = ["pizza"];
//["chinese"];
const webLink = "https://www.foodnetwork.com/search/";
const shortLink = "https:";

let Recipe = "";
let totalCount = 0;
let finalTotal = 0;
let recipeIndex = 1;

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

    for (let item of categories) {
        try {
            const response = await got(webLink + item + '-');
            const $ = cheerio.load(response.body);

            let categoryName = item.toUpperCase();

            console.log('---------------------------------' + categoryName + '---------------------------------');

            $('.o-RecipeResult').each((i, articles) => {
                //URL page to individual recipe
                const newRecipe = shortLink + $(articles).find('.m-MediaBlock__a-Headline').find('a').attr('href');
                //Name of Recipe
                const recipeName = $(articles).find('.m-MediaBlock__a-HeadlineText').text();
                //URL to image of recipe
                let imageURL = $(articles).find('.m-MediaBlock__m-MediaWrap').find('img').attr('src');
                if (imageURL === '' || imageURL === undefined) {
                    imageURL = 'No Image Available';
                } else {
                    imageURL = shortLink + imageURL;
                }
                //Ratings and Number
                let rawRating = $(articles).find('.gig-rating-stars').attr('title');
                let rating = '';
                if (rawRating !== undefined) {
                    rawRating = rawRating.split(' ', 1);
                    rating = rawRating[0];
                }

                let rawReview = $(articles).find('.gig-rating-ratingsum').text();
                let reviewNumber = '';
                if (rawReview !== undefined) {
                    rawReview = rawReview.split(' ', 1);
                    reviewNumber = rawReview[0];
                }

                console.log(recipeName);
                console.log(newRecipe);
                console.log(imageURL);
                console.log("Stars: " + rating + " With " + reviewNumber + " reviews");
                console.log('');

                //Push objects onto temporary Object Arrays
                scrapedDataOBJ.data.push({ id: finalTotal, name: recipeName, ratings: rating, reviewCount: reviewNumber, recipeURL: newRecipe, recipeImageURL: imageURL });
                scrapedAdditional.data.push({ id: finalTotal, recipeURL: newRecipe });

                totalCount++;
                finalTotal++;
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

    //Scrape Ingredients + Additional Info
    for (let recipe of scrapedDataOBJ.data) {
        let url = recipe.recipeURL;

        console.log('Start ingriedient load: ' + url);
        console.log('Scraping Item ' + loadCount + ' of ' + finalTotal);

        try {
            const response = await got(url);
            const $ = cheerio.load(response.body);

            console.log('Loaded Successfully');
            console.log('---------------------------------' + 'Recipe' + '---------------------------------');
            //Scrape Ingredients
            $('.ingredients-section li').each((i, article) => {

            })
        } catch (error) {
            console.log('Error: ', error);
        }
    }
    //Initialise and write to JSON files
    console.log("Write Start File 1")
    let jsonInitialise = JSON.stringify(scrapedDataOBJ);
    fs.writeFile('foodNetwork.json', jsonInitialise, () => { console.log("Write Done") });

    console.log("Write Start File 2")
    let jsonInitialiseTwo = JSON.stringify(scrapedAdditional);
    fs.writeFile('foodNetworkAdditional.json', jsonInitialiseTwo, () => { console.log("Write Done") });
}
webScraper();