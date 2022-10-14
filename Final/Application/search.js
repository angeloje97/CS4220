const router = require("express").Router();
const tvMaze = require("tvmaze-api");

// const getDate = () => {
//   const today = new Date();
//   const date = `${today.getMonth() + 1}-${
//     today.getDay() + 1
//   }-${today.getFullYear()}`;

//   const period = today.getHours < 12 ? "AM" : "PM";

//   const time = `${
//     today.getHours() % 12
//   }:${today.getMinutes()}:${today.getSeconds()} ${period}`;

//   return { date, time };
// };

router.get("/", async (req, res) => {
  try {
    const { showName } = req.query;

    const shows = await tvMaze.shows(showName);
    const showList = shows.map((item) => {
      return { id: item.show.id, name: item.show.name };
    });
    //const { date, time } = getDate();

    const data = {
      keyWord: showName,
      resultsCount: shows.length,
      saveData: true,
      showId: "{replace this with show id}",
    };

    res.status(200).json({
      data,
      showList,
    });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

router.post("/show/details", async (req, res) => {
  try {
    const { data } = req.body;
    const { showId } = data;

    if (!parseInt(showId)) {
      res.status(409).json({
        error: `Show id must be an object that can be parsed into a number`,
      });
      return;
    }

    const pickedShow = await tvMaze.show(showId);

    delete data.showId;

    if (!pickedShow) {
      res.status(404).json({
        error: `No show with corresponding showID ${showId} exists in the list which is given`,
      });
      return;
    }

    data.pickedShow = pickedShow.name;
    data.selectedID = showId;

    data.time = new Date().toString(); //`${time} ${date}`;

    if (data.saveData) {
      delete data.saveData;
      const db = req.app.locals.db;
      const collection = db.collection("History");
      await collection.insertOne(data);
    } else {
      delete data.saveData;
    }

    res.status(200).json({ data, show: pickedShow });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
