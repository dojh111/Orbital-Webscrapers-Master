const got = require("got");
const cheerio = require("cheerio");

const test = async () => {
  const response = await got("https://sindresorhus.com");
console.log(response.body);
};

test();
