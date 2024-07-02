import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
    console.log(` DataBase Connected with mongoose !!`);
  } catch (error) {
    console.error(`MongoDb Connection Error : ${error}`);
    process.exit(1);
  }
};

export default dbConnect;
