import { Router } from "express"

import { changePassword, login, logout, register } from "../controllers/authController.js"
import authorization from "../middlewares/authMiddleware.js"

const router = new Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.put("/change-password", authorization, changePassword)

export default router