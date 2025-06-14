const mongoose = require("mongoose");
const { Schema } = mongoose;

const watchListSchema = new Schema(
  {
    watchListName: { type: String, required: true,unique: true },
    stocks: [
      {
        symbol: String,
        longName: String
      }
    ]
  },
  {
    collection: 'watchList',
    versionKey: false,
    autoIndex: true
  }
);
function getWatchListModel(userDbConnection) {
  return (
    userDbConnection.models["WatchList"] ||
    userDbConnection.model("WatchList", watchListSchema)
  );
}

module.exports = {getWatchListModel};