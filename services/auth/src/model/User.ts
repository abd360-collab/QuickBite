import mongoose, {Document, Schema} from "mongoose";


// This is just a type definition
export interface IUser extends Document {
    name: string;
    email: string;
    image: string;
    role: string;
}

const schema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: true,
    },
     email: {
        type: String,
        unique: true,
        required: true,
    },
     image: {
        type: String,
        required: true,
    },
     role: {
        type: String,
        default: null,
    },
},{
    timestamps: true,
});


// What it means: "Hey Mongoose, build the final User tool that I will use to talk to the database. And remember, anytime this tool pulls a record OUT of the database, instantly stamp it with the <IUser> VIP badge."
// Why it's a lifesaver: Later on in your code, when you write const foundUser = await User.findById(id);, TypeScript knows for a fact that foundUser is an <IUser>. Therefore, when you type foundUser., your editor will instantly pop up .name, .email, .image, and .role for you to click on.
const User = mongoose.model<IUser>("User", schema);
export default User;