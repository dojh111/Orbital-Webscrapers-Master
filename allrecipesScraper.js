const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

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

            $('.fixed-recipe-card').each((i, articles) => {
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
            console.log('Global Total: ' + finalTotal);
        } catch (error) {
            console.log('Error: ', error);
        }
    }
    //For Dubugging Purposes
    //console.log(scrapedDataOBJ);

    //Initialise and write to JSON file
    let jsonInitialise = JSON.stringify(scrapedDataOBJ);
    fs.writeFileSync('allRecipesScraped.json', jsonInitialise, 'utf8');
}
webScraper();
