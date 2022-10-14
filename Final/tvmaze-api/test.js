const index = require("./index.js");

const test = async (showName) => {
  const shows = await index.shows(showName);
  console.log(shows);
};
