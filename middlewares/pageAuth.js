import jwt from "jsonwebtoken"
import Users from "../models/Users.js"

const { JWT_SECRET } = process.env

export default async (req, res, next) => {
	try {
		const token = req.cookies?.token

		if (!token) {
			return res.redirect("/login")
		}

		const decoded = jwt.verify(token, JWT_SECRET)
		if (!decoded?.userId) {
			return res.redirect("/login")
		}

		const user = await Users.findByPk(decoded.userId)
		if (!user) {
			return res.redirect("/login")
		}

		req.currentUser = user
		next()
	} catch (err) {
		res.redirect("/login")
	}
}