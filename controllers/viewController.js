import { Users } from "../models/index.js"
import { onlineUsers } from "../socket/index.js"

export const renderDashboard = async (req, res) => {
	try {
		const currentUser = req.currentUser

		const leaderboard = await Users.findAll({
			order: [["elo", "DESC"]],
			limit: 10,
			attributes: ["id", "username", "avatarUrl", "elo"],
		})

		const onlineUserIds = Array.from(onlineUsers.keys())

		res.render("dashboard", {
			currentUser,
			leaderboard,
			onlineUserIds,
			token: req.cookies.token,
		})
	} catch (err) {
		console.error(err)
		res.status(500).send("Server error")
	}
}

export const renderLogin = (req, res) => {
	res.render("login")
}

export const renderRegister = (req, res) => {
	res.render("register")
}
