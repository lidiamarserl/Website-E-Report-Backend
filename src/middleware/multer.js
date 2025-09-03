const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/files');
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().getTime();
        console.log(file);
        const originalname = file.originalname;
        // const extention = path.extname(file.originalname);
        cb(null, `${originalname}-${timestamp}`);
    }
});

const upload = multer({storage: storage});

module.exports = upload;