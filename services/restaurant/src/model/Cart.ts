import mongoose, {Schema, Document} from "mongoose";

export interface ICart extends Document{
    userId: string;
    restaurantId: mongoose.Types.ObjectId;
    itemId: mongoose.Types.ObjectId;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

const schema = new Schema<ICart>({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
        index: true,
    },
    itemId: {
        type: Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true,
        index: true,
    },
    quantity: { // Fixed typo: quauntity -> quantity
        type: Number,
        default: 1,
        min: 1,
    },
},{
    timestamps: true,
});

schema.index({userId: 1, restaurantId: 1, itemId: 1 }, {unique: true});

export default mongoose.model<ICart>("Cart", schema);