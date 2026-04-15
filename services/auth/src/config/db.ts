import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string, {
        dbName: "Zomato_Clone",
    });

    console.log("connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;


// ⚠️ The Danger of as (Lying to the Compiler)
// The "as" keyword is a tool, but it turns off TypeScript's safety checks for that specific line.

// If you use as string, but you actually did forget to put the URL in your .env file, TypeScript won't catch the bug. Your code will compile perfectly, but the moment you start your Auth service, 
// Mongoose will crash because the string is actually empty.