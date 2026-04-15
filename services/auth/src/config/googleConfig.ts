import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID= process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET;


//Create a Google login handler for my app using my app ID and secret,
//and return the login result directly instead of redirecting.

// When you click "Login with Google" → this OAuth client handles that process.
export const oauth2client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID, // This is like your app’s username. Given by Google when you create a project.
    GOOGLE_CLIENT_SECRET, // This is like your app’s password. Used to verify your app is real. Should be kept secret.
    "postmessage"
)

// When the user clicks "Login" on your frontend, 
// a Google popup appears. 
// The user types their password into Google. 
// Google says, "Okay, you are who you say you are." 
// Google gives your frontend a code.
//  This code is basically a temporary, one-time-use ticket. 
//  The frontend instantly sends this ticket to your backend via this req.body