const request = require('request');
const cheerio = require('cheerio');

const categories = ["western", "mediterranean", "indian", "chinese", "malay", "fish and chips"]
const webLink = "https://www.epicurious.com/search/";
const recipeSite = "?content=recipe";
const shortLink = "https://www.epicurious.com";

let Recipe = "";
let totalCount = 0;
let finalTotal = 0;

//Loop through categories
for(const item of categories) {
    request(webLink+item+recipeSite, (error, response, html) => {
        if(!error && response.statusCode == 200) {
            const $= cheerio.load(html);

            let categoryName = item.toUpperCase();

            console.log('---------------------------------'+categoryName+'---------------------------------');

            $('.recipe-content-card').each((i, articles) => {
                //URL page to individual recipe
                const newRecipe = $(articles).find('.photo-link').attr('href');
                //Name of Recipe
                const recipeName = $(articles).find('.photo-link').attr('aria-label');
                //Ratings and Number
                const rating = $(articles).find('.recipes-ratings-summary').attr('data-reviews-rating');
                const reviewNumber = $(articles).find('.recipes-ratings-summary').attr('data-reviews-count');

                if(newRecipe !== Recipe) {
                    Recipe = newRecipe;
                    let fullLink = shortLink+Recipe;
                    //Clear failed links
                    if(fullLink !== 'https://www.epicurious.comundefined') {
                        console.log('');
                        console.log(recipeName);
                        console.log(fullLink);
                        console.log('Ratings: ' + rating + '   ' + 'Review Count: ' + reviewNumber);
                        totalCount++;
                        finalTotal++;
                    }
                }
            });
            
            console.log('');
            console.log('Total Recipes: ' + totalCount);
            console.log('-------------------------------'+'END OF SECTION'+'-------------------------------')
            console.log('');
            totalCount = 0;
        }
        console.log(finalTotal);
    })
}