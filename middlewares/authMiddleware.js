import HttpErrors from "http-errors"
import jwt from "jsonwebtoken"

import Users from "../models/Users.js"

const { JWT_SECRET } = process.env

export default async (req, res, next) => {
	try {
		const authHeader = req.headers?.authorization

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			next(new HttpErrors(401))
			return
		}

		const token = authHeader.replace("Bearer ", "").trim()

		let decryptData = null
		try {
			decryptData = jwt.verify(token, JWT_SECRET)
		} catch (err) {
			console.log(err.message)
		}

		if (!decryptData || !decryptData?.userId) {
			next(new HttpErrors(401))
			return
		}

		req.userId = decryptData?.userId
		req.user = { id: decryptData.userId }

		const user = await Users.findByPk(req.userId)
		if (!user) {
			next(new HttpErrors(401))
			return
		}

		next()
	} catch (err) {
		console.log(err)
		next(new HttpErrors(401))
	}
}
