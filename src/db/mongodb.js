//CRUD create read update delete

const { MongoClient, ObjectID } = require("mongodb");
const Collection = require("mongodb/lib/collection");

const connectionURL = "mongodb://127.0.0.1:27017";
const databaseName = "exquizite";

const id = new ObjectID();
console.log(id);
console.log(id.getTimestamp());

MongoClient.connect(
  connectionURL,
  { useNewURLParser: true },
  (error, client) => {
    if (error) {
      return console.log("Unable to connect to database");
    }

    const db = client.db(databaseName);

    const deleteOperation = db.collection("tasks").deleteOne({ name: "gym" });

    const deleteManyOperation = db
      .collection("tasks")
      .deleteMany({ completed: true });

    deleteOperation
      .then((result) => console.log(result))
      .catch((error) => {
        console.log(error);
      });

    deleteManyOperation
      .then((result) => console.log(result))
      .catch((error) => {
        console.log(error);
      });
  }
);
