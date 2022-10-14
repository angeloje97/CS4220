const tvMaze = require("./index");

const test = async () => {

    const show = await tvMaze.show(82);

    console.log(show);

}

test();