import fs from "fs"
import path from "path"
import { Users } from "../models/index.js"

export const getProfile = async (req, res) => {
	try {
		const user = await Users.findByPk(req.user.id, {
			attributes: { exclude: ["password"] },
		})

		if (!user) {
			return res.status(404).json({ message: "User not found" })
		}

		res.status(200).json(user)
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message })
	}
}

export const updateProfile = async (req, res) => {
	try {
		const { username, email } = req.body

		const user = await Users.findByPk(req.user.id)
		if (!user) {
			return res.status(404).json({ message: "User not found" })
		}

		if (username && username !== user.username) {
			const exists = await Users.findOne({ where: { username } })
			if (exists) {
				return res.status(409).json({ message: "This username is already taken" })
			}
			user.username = username
		}

		if (email && email !== user.email) {
			const exists = await Users.findOne({ where: { email } })
			if (exists) {
				return res.status(409).json({ message: "This email is already in use" })
			}
			user.email = email
			user.isVerified = false
		}

		await user.save()

		const { password, ...userData } = user.toJSON()
		res.status(200).json({ message: "Profile updated", user: userData })
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message })
	}
}

export const uploadAvatar = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "File not uploaded" })
		}

		const user = await Users.findByPk(req.user.id)
		if (!user) {
			return res.status(404).json({ message: "User not found" })
		}

		if (user.avatarUrl) {
			const oldPath = path.join(process.cwd(), user.avatarUrl)
			fs.unlink(oldPath, (err) => {
				if (err) console.log("Error deleting file:", err.message)
			})
		}

		user.avatarUrl = `/uploads/avatars/${req.file.filename}`
		await user.save()

		res.status(200).json({
			message: "Avatar updated",
			avatarUrl: user.avatarUrl,
		})
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message })
	}
}

export const deleteAvatar = async (req, res) => {
	try {
		const user = await Users.findByPk(req.user.id)
		if (!user) {
			return res.status(404).json({ message: "User not found" })
		}

		if (!user.avatarUrl) {
			return res.status(400).json({ message: "Avatar not set" })
		}

		const filePath = path.join(process.cwd(), user.avatarUrl)
		fs.unlink(filePath, (err) => {
			if (err) console.log("Error deleting file:", err.message)
		})

		user.avatarUrl = null
		await user.save()

		res.status(200).json({ message: "Avatar deleted" })
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message })
	}
}