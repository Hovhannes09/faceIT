import { Router } from "express"
import upload from "../src/multer.js"
import {
	deleteAvatar,
	getProfile,
	updateProfile,
	uploadAvatar,
} from "../controllers/profileController.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import validate from "../middlewares/validate.js"
import { updateProfileSchema } from "../validators/profileValidator.js"

const router = Router()

router.use(authMiddleware)

router.get("/", getProfile)
router.put("/", validate(updateProfileSchema), updateProfile)
router.post("/avatar", upload.single("avatar"), uploadAvatar)
router.delete("/avatar", deleteAvatar)

export default router