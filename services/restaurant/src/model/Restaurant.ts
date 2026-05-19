import mongoose, {Schema, Document} from "mongoose";

export interface IRestaurant extends Document {
    name: string;
    description?: string;
    image: string;
    ownerId: string;
    phone: number;
    isVerified: boolean;

    autoLocation: {
        type: "Point",
        coordinates: [number, number]; //[longitude, latitude];
        formattedAddress: string;
    };
    isOpen: boolean;
    createdAt: Date;
}

const schema = new Schema<IRestaurant>({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    description: String,
    image: {
        type: String,
        required: true,
    },
// you are storing owner identity manually.
// Probably because:
// Auth Service is separate microservice
// VERY important microservices design concept.

     ownerId: {                                   
        type: String,
        required: true,
    },
     phone: {
        type: Number,
        required: true,
    },
    isVerified: {
        type: Boolean,
        required: true,
    },
    autoLocation: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        formattedAddress: {
            type: String,
        }

    },
    isOpen: {
        type: Boolean,
        default: false,
    },

}, {
    timestamps: true,
}) ;


// “2dsphere indexes enable efficient geospatial queries in MongoDB such as nearby restaurant searches, 
// distance calculations, and radius filtering using Earth-coordinate geometry.”
schema.index({ autoLocation: "2dsphere" });

export default mongoose.model<IRestaurant>("Restaurant", schema);