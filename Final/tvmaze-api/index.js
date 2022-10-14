const superagent = require("superagent");
const config = require("./config.json");

const shows = async (showName) => {
  const response = await superagent.get(
    `${config.url}/search/shows?q=${showName}`
  );

  return response.body;
};

const show = async (showID) => {
  const response = await superagent.get(`${config.url}/shows/${showID}`);
  return response.body;
};

module.exports = { shows, show };
