// for the default version
const algoliasearch = require('algoliasearch');

const AppID = "LUNTOUZ9LT";
const SearchKey = "7c1b3bee77ff276c4549b81063e2cac7";
const AdminKey = "e07003be5ef8b46255e7e3c9bcf2ef90";

const client = algoliasearch(AppID, AdminKey);
const index = client.initIndex("AllRecipes");