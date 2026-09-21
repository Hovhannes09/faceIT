import fs from "fs"
import multer from "multer"
import path from "path"

const uploadDir = "uploads/avatars"

if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir)
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname)
		const uniqueName = `avatar_${req.user.id}_${Date.now()}${ext}`
		cb(null, uniqueName)
	},
})

const fileFilter = (req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true)
	} else {
		cb(new Error("Allowed image types (jpeg, png, webp)"), false)
	}
}

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
})

export default upload