import { Request, Response } from "express"
import User from "../model/User.js";
import jwt from 'jsonwebtoken';
import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2client } from "../config/googleConfig.js";
import axios from "axios";


// In plain JavaScript, req and res are just magic objects that Express gives you. 
// But TypeScript hates magic. 
// It wants to know exactly what those objects look like.

// Because you installed @types/express earlier, 
// the creators of Express have provided you with pre-built TypeScript Interfaces (blueprints) 
// named Request and Response. 
// You are importing those blueprints here to use as name tags for your variables.
export const loginUser = TryCatch(async(req: Request, res:Response) => {
    const {code} = req.body;

    if(!code) {
        return res.status(400).json({
            message: "Authorization code is required",
        });
    }

 // 👉 You are sending the code (from frontend) to Google
 // “Give me real access data for this user”
    const googleRes = await oauth2client.getToken(code)

    oauth2client.setCredentials(googleRes.tokens)

    const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
     const {email, name, picture } = userRes.data;

    let user = await User.findOne({email})

    if(!user) {
        user = await User.create({
            name,
            email,
            image: picture,
        }) ;
    }

     const token = jwt.sign({user}, process.env.JWT_SEC as string, {
        expiresIn: "15d",
     });

     res.status(200).json({
        message: "Logged Successfully",
        token,
        user,
     });
});



const allowedRoles = ["customer", "rider", "seller"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async(req: AuthenticatedRequest, res) => {
   if(!req.user?._id) {
    return res.status(401).json({
        message: "Unauthorized",
    });
   }

   const {role} = req.body as { role: Role };

   if(!allowedRoles.includes(role)) {
    return res.status(400).json({
        message: "Invald role",
    });
   }

   const user = await User.findByIdAndUpdate(req.user._id, {role}, {new:true})

   if(!user) {
       return res.status(404).json({
        message: "User not found",
    });
   }

    const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
        expiresIn: "15d",
     });

     res.json({ user, token })
});

