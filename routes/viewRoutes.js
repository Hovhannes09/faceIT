import { Router } from "express"
import { renderDashboard } from "../controllers/viewController.js"
import pageAuth from "../middlewares/pageAuth.js"
import { renderLogin } from "../controllers/viewController.js"

const router = Router()

router.get("/dashboard", pageAuth, renderDashboard)
router.get("/login", renderLogin)

export default router