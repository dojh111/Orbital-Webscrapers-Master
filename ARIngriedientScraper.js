const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

const cookingUnits = ["teaspoon", "tablespoon", "cup", "quart", "ounce", "pound", "lb", "dash", "pinch", "clove", "gram", "kilogram"];
const specificUnits = ["can", "large", "small", "container", "bottle"];
const extraText = ["of", "to", "taste", "grated", "ground", "grounded", "chopped", "sliced", "diced", "very", "ripe", "fresh"]

let ingredientArray = [];

const testURL = ["https://www.allrecipes.com/recipe/241553/buckwheat-pancakes/?internalSource=hub%20recipe&referringContentType=Search&clickId=cardslot%204",
    "https://www.allrecipes.com/recipe/258494/chinese-barbeque-pork-char-siu/?internalSource=hub%20recipe&referringContentType=Search&clickId=cardslot%202",
    "https://www.allrecipes.com/recipe/241066/one-skillet-mexican-quinoa/?internalSource=hub%20recipe&referringContentType=Search&clickId=cardslot%201",
    "https://www.allrecipes.com/recipe/6984/banana-sour-cream-bread/?internalSource=hub%20recipe&referringId=78&referringContentType=Recipe%20Hub&clickId=cardslot%205"];

const ingredientScraper = async () => {
    console.log('Starting Ingredient Scrape');

    //Cleaning up and separation of pulled ingredient
    for (let url of testURL) {
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
}

ingredientScraper();

// Some Addtional notes
// 1. HTML index