const fs = require("fs");
const StreamArray = require("stream-json/streamers/StreamArray");

//Arguments: Ending page, page interval, category name (in camel case)
let endingPage = Number(process.argv[2]);
const interval = Number(process.argv[3]);
const type = process.argv[4];

let database = [];

//Pages that don't fit into intervals
let remainder = endingPage % interval;
endingPage -= remainder;

const jsonStream = StreamArray.withParser();

//Process json files in interval of 10 pages each
for (let i = 1; i < endingPage; i += interval) {
  fs.createReadStream(
    `./${type}/${type}_${i}_to_${i + interval - 1}.json`
  ).pipe(jsonStream.input);
  jsonStream.on("data", ({ key, value }) => {
    if (key < 10) {
      console.log(value.name);
    }
  });
  jsonStream.on("end", () => {
    console.log("All done")
  })
}

// //Process remainder json file
// if (remainder !== 0) {
//   let data = fs.readFileSync(
//     `./${type}/${type}_${endingPage + 1}_to_${endingPage + remainder}.json`
//   );
//   data = JSON.parse(data);
//   database.push(...data);
// }

// for (let i = 0; i < database.length; i++) {
//   database[i].id = i;
// }

// database = JSON.stringify(database, null, 2);
// fs.writeFileSync(`./${type}/${type}Database.json`, database);
