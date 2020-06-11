const request = require('request');
const cheerio = require('cheerio');

const categories = ["western", "mediterranean", "indian", "chinese", "malay", "fish and chips"]
const webLink = "https://www.allrecipes.com/search/results/?wt=";
const recipeSite = "&sort=re";
const shortLink = "";

let Recipe = "";
let totalCount = 0;

//Loop through categories
for(const item of categories) {
    request(webLink+item+recipeSite, (error, response, html) => {
        if(!error && response.statusCode == 200) {
            const $= cheerio.load(html);

            let categoryName = item.toUpperCase();

            console.log('---------------------------------'+categoryName+'---------------------------------');
 
            $('.grid-card-image-container a').each((i, articles) => {
                //URL page to individual recipe
                const newRecipe = $(articles).attr('href');
                //Name of Recipe
                const recipeName = $(articles).find('.fixed-recipe-card__img, .ng-isolate-scope').attr('title');
                //URL to image of recipe
                const imageURL = $(articles).find('.fixed-recipe-card__img, .ng-isolate-scope').attr('data-original-src');

                if(newRecipe !== Recipe) {
                    Recipe = newRecipe;
                    let fullLink = shortLink+Recipe;
                    //Clear failed links
                    console.log('');
                    console.log(recipeName);
                    console.log(fullLink);
                    console.log(imageURL);
                    totalCount++;
                }
            });
            
            console.log('');
            console.log('Total Recipes: ' + totalCount);
            console.log('-------------------------------'+'END OF SECTION'+'-------------------------------')
            console.log('');
            totalCount = 0;
        }
    })
}