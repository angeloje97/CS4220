const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const express = require("express");
const search = require("./search");
const history = require("./history");

const app = express();
const port = 8888;
const config = require("./config.json");

const url = `mongodb+srv://${config.username}:${config.password}@${config.cluster}/${config.database}?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());

const client = new MongoClient(url);

app.get("/", (req, res) => {
  res.status(200).json({ Succesful: "Get sucessful" });
});

app.use("/search", search);
app.use("/history", history);

client.connect((error) => {
  if (error) {
    throw new Error("Failed to connect to mongodb");
  }

  app.locals.db = client.db();

  app.listen(port, () => {
    console.log(`Server is listening to port ${port}`);
  });
});
