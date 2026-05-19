// jab hm cloudinary par upload krte hain image ko , to image file ko buffer me 
//convert krna hota hai, cloudinary bas buffer ko hi accept krta h, 
// datauri buffer me convert krne me madad krta hai

import DataUriParser from "datauri/parser.js"
import path from 'path' // inbuilt in nodeJs.

const getBuffer = (file: any) => {
    const parser = new DataUriParser();

    const extName = path.extname(file.originalname).toString();

    return parser.format(extName, file.buffer);
};

export default getBuffer;