const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const { format, toNamespacedPath } = require('path');

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

async = () => {
    scrapedDataOBJ.data.push({ name: 'test', ratings: 'test', reviewCount: 'test', recipeURL: 'test', recipeImageURL: 'test' });
    let json = JSON.stringify(scrapedDataOBJ);
    fs.writeFile('allRecipesScraped.json', json, 'utf8', (err) => {
        if (err) throw err;
        console.log('Initialise Complete');
    });

    //Loop through categories
for (const item of categories) {
    request(webLink + item + recipeSite, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);

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

                    //Write data to JSON file
                    fs.readFile('allRecipesScraped.json', 'utf8', function readFileCallback(err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            scrapedDataOBJ = JSON.parse(data);
                            scrapedDataOBJ.data.push({ id: finalTotal, name: recipeName, ratings: rating, reviewCount: reviewNumber, recipeURL: fullLink, recipeImageURL: imageURL });
                            let json = JSON.stringify(scrapedDataOBJ);
                            fs.writeFile('allRecipesScraped.json', json, 'utf8', (err) => {
                                if (err) throw err;
                                console.log('Complete Write');
                            });
                        }
                    });

                    //For Debugging Purposes
                    // console.log('');
                    // console.log(recipeName);
                    // console.log(fullLink);
                    // console.log('ImageURL: '+imageURL);
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
        }
        console.log('Total: ' + finalTotal);
    })
}
}

// //Loop through categories
// for (const item of categories) {
//     request(webLink + item + recipeSite, (error, response, html) => {
//         if (!error && response.statusCode == 200) {
//             const $ = cheerio.load(html);

//             let categoryName = item.toUpperCase();

//             console.log('---------------------------------' + categoryName + '---------------------------------');

//             $('.fixed-recipe-card').each((i, articles) => {
//                 //URL page to individual recipe
//                 const newRecipe = $(articles).find('.grid-card-image-container').find('a').attr('href');
//                 //Name of Recipe
//                 const recipeName = $(articles).find('.fixed-recipe-card__img, .ng-isolate-scope').attr('title');
//                 //URL to image of recipe
//                 const imageURL = $(articles).find('.fixed-recipe-card__img, .ng-isolate-scope').attr('data-original-src');
//                 //Ratings and Number
//                 const rating = $(articles).find('.stars, .stars-5').attr('data-ratingstars');
//                 const reviewNumber = $(articles).find('.fixed-recipe-card__reviews').contents().attr('number');

//                 //Filter out the videos
//                 if ((newRecipe !== Recipe) && !(newRecipe.includes('video'))) {
//                     Recipe = newRecipe;
//                     //Final URL to recipe page
//                     let fullLink = shortLink + Recipe;

//                     //Write data to JSON file
//                     fs.readFile('allRecipesScraped.json', 'utf8', function readFileCallback(err, data) {
//                         if (err) {
//                             console.log(err);
//                         } else {
//                             scrapedDataOBJ = JSON.parse(data);
//                             scrapedDataOBJ.data.push({ id: finalTotal, name: recipeName, ratings: rating, reviewCount: reviewNumber, recipeURL: fullLink, recipeImageURL: imageURL });
//                             let json = JSON.stringify(scrapedDataOBJ);
//                             fs.writeFile('allRecipesScraped.json', json, 'utf8', (err) => {
//                                 if (err) throw err;
//                                 console.log('Complete Write');
//                             });
//                         }
//                     });

//                     //For Debugging Purposes
//                     // console.log('');
//                     // console.log(recipeName);
//                     // console.log(fullLink);
//                     // console.log('ImageURL: '+imageURL);
//                     // console.log('Ratings: ' + rating + '   ' + 'Review Count: ' + reviewNumber);

//                     totalCount++;
//                     finalTotal++;
//                 }
//             });

//             console.log('');
//             console.log('Total Recipes: ' + totalCount);
//             console.log('-------------------------------' + 'END OF SECTION' + '-------------------------------')
//             console.log('');
//             totalCount = 0;
//         }
//         console.log('Total: ' + finalTotal);
//     })
// }