import { Router } from "express"
import { renderDashboard } from "../controllers/viewController.js"
import pageAuth from "../middlewares/pageAuth.js"
import { renderLogin } from "../controllers/viewController.js"

const router = Router()

router.get("/lang/:code", (req, res) => {
	const { code } = req.params
	const SUPPORTED_LANGS = ["ru", "en"]

	if (SUPPORTED_LANGS.includes(code)) {
		res.cookie("lang", code, {
			maxAge: 365 * 24 * 60 * 60 * 1000,
			httpOnly: false,
		})
	}

	const redirectTo = req.headers.referer || "/dashboard"
	res.redirect(redirectTo)
})

router.get("/dashboard", pageAuth, renderDashboard)
router.get("/login", renderLogin)

export default router