import multer from 'multer';

const storage = multer.memoryStorage(); // cloud storage

const uploadFile = multer({ storage }).single("file");

export default uploadFile;