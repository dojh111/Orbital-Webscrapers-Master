const request = require('request');
const cheerio = require('cheerio');

const categories = ["western", "mediterranean", "indian", "chinese", "malay", "fish and chips"]
const webLink = "https://www.epicurious.com/search/";
const recipeSite = "?content=recipe";
const shortLink = "https://www.epicurious.com";

let Recipe = "";
let totalCount = 0;

//Loop through categories
for(const item of categories) {
    request(webLink+item+recipeSite, (error, response, html) => {
        if(!error && response.statusCode == 200) {
            const $= cheerio.load(html);

            let categoryName = item.toUpperCase();

            console.log('---------------------------------'+categoryName+'---------------------------------');
 
            $('.results-group').find('.photo-link').each((i, articles) => {
                //URL page to individual recipe
                const newRecipe = $(articles).attr('href');
                //Name of Recipe
                const recipeName = $(articles).attr('aria-label');

                if(newRecipe !== Recipe) {
                    Recipe = newRecipe;
                    let fullLink = shortLink+Recipe;
                    //Clear failed links
                    if(fullLink !== 'https://www.epicurious.comundefined') {
                        console.log('');
                        console.log(recipeName);
                        console.log(fullLink);
                        totalCount++;
                    }
                }
            });
            
            console.log('');
            console.log('Total Recipes: ' + totalCount);
            console.log('-------------------------------'+'END OF SECTION'+'-------------------------------')
            console.log('');
            totalCount = 0;

            //const imageURL = $('article.recipe-content-card > a > div > div > picture > img').map((i, el) => $(el).attr('src')).get();
            //console.log(imageURL);
        }
    })
}