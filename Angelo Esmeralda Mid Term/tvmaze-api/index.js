const config = require("./config.json");
const superagent = require("superagent");

//returns an array of shows.
const shows = async (searchString) => {
    const response = await superagent.get(`${config.url}/search/shows?q=${searchString}`);

    return response.body;
}

//returns a single show.
const show = async (showID) => {
    const response = await superagent.get(`${config.url}/shows/${showID}`);

    return response.body;
}

const episode = async (episodeId) => {
    const response = await superagent.get(`${config.url}/episodes/${episodeId}`);

    console.log(response.body);
    return response.body;
}

const episodesBySeasons = async (seasonId) => {
    const response = await superagent.get(`${config.url}/seasons/${seasonId}/episodes`);

    return response.body;
}

const seasons = async (showId) => {
    const response = await superagent.get(`${config.url}/shows/${showId}/seasons`)
    return response.body;
}






module.exports = {
    episodesBySeasons,
    seasons,
    episode,
    show,
    shows
};