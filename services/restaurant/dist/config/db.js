import mongoose from "mongoose";
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            dbName: "Zomato_Clone",
        });
        console.log("connected to MongoDB");
    }
    catch (error) {
        console.log(error);
    }
};
export default connectDB;
