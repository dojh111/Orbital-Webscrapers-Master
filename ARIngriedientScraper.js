const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

const cookingUnits = ["teaspoon", "tablespoon", "cup", "quart", "ounce", "pound", "lb", "dash", "pinch", "clove", "can", "gram", "kilogram"];

const testPhrase = ["1 (3 pound) boneless pork butt (shoulder)", "⅓ cup hoisin sauce", "1 teaspoon kosher salt, or to taste", "⅛ teaspoon pink curing salt (optional)"];

const ingredientScraper = async () => {
    console.log('Starting Ingredient Scrape');

    //Cleaning up and separation of pulled ingredient
    for (let i = 0; i < testPhrase.length; i++) {
        let indexArray = [];
        let item = testPhrase[i];

        //Remove commas
        item = item.split(',', 1);
        item = item[0].split(' ');

        //Find index of items with () to remove
        for (let j = 0; j < item.length; j++) {
            if ((item[j].indexOf('(') !== -1) || (item[j].indexOf(')') !== -1)) {
                indexArray.push(j);
            }
        }

        //Remove all items with ()
        if (indexArray.length > 0) {
            for (let j = indexArray.length - 1; j >= 0; j--) {
                item.splice(indexArray[j], 1);
            }
        }
        console.log(item);
    }
}

ingredientScraper();

// Some Addtional notes
// 1. All recipes uses a string to show fractions, as such cant convert to number - NaN IMPORTANT