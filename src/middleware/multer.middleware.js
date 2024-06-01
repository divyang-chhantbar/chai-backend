import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"), false)
  }
}

const errorHandler = (err, req, res, next) => {
  if (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to upload file" })
  } else {
    next()
  }
}

export const upload = multer({
  storage,
  fileFilter,
  errorHandler
})