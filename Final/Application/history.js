const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    try {
      const db = req.app.locals.db;
      const collection = db.collection("History");

      const data = await collection.find({}).toArray();

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.toString() });
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
