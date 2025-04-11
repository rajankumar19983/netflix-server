import mongoose from "mongoose";

const ConfigDB = async () => {
  try {
    const DB_URL = process.env.MONGO_URI;
    const db = await mongoose.connect(DB_URL);
    console.log("Connected to db", db.connection.host);
  } catch (err) {
    console.log("Error connecting to db:- ", err);
  }
};

export default ConfigDB;
