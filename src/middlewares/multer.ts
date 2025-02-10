import multer from "multer"
import fs from "fs"
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(!fs.existsSync("/tmp/uploads")){
            fs.mkdirSync("/tmp/uploads")
        }
      cb(null, '/tmp/uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
  const upload = multer({ storage: storage })