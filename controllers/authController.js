import joi from 'joi'
import jwt from 'jsonwebtoken'
import md5 from 'md5'
import { User } from '../models/index.js'

const registerSchema = joi.object({
	username: joi.string().min(3).max(30).required(),
	email: joi.string().email().required(),
	password: joi.string().min(6).required(),
	fullName: joi.string().min(3).max(50).required()
})

const loginSchema = joi.object({
	email: joi.string().email().required(),
	password: joi.string().min(6).required()
})

export async function register(req, res) {
	try {
		const { error, value } = registerSchema.validate(req.body)
		if (error) {
			return res.status(400).json({ error: error.details[0].message })
		}

		const existingUser = await User.findOne({ where: { email: value.email } })
		if (existingUser) {
			return res.status(400).json({ error: 'Email already exists' })
		}

		const user = await User.create({
			username: value.username,
			email: value.email,
			password: md5(value.password),
			fullName: value.fullName,
			role: 'user'
		})

		res
			.status(201)
			.json({ message: 'User registered successfully', user })
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' })
	}
}

export async function login(req, res) {
	try {
		const { error, value } = loginSchema.validate(req.body)
		if (error) {
			return res.status(400).json({ error: error.details[0].message })
		}

		const user = await User.findOne({ where: { email: value.email } })
		if (!user)
			return res.status(401).json({ message: 'Invalid email or password' })

		if (!user || user.password !== md5(value.password)) {
			return res.status(401).json({ error: 'Invalid email or password' })
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		)

		res.json({
			message: 'Logged in',
			user: { id: user.id, email: user.email, role: user.role }
		})

		res.status(200).json({ message: 'Login successful', token })
	} catch (err) {
		res.status(500).json({ message: 'Server error', error: err.message })
	}
}

export async function logout(req, res) {
	res.clearCookie('token')
	res.json({ message: 'Logged out' })
}

export async function changePassword(req, res) {
	try {
		const { oldPassword, newPassword } = req.body
		if (!newPassword || newPassword.length < 6)
			return res
				.status(400)
				.json({ message: 'New password must be at least 6 characters' })

		const user = await User.findByPk(req.user.id)
		if (user.password !== md5(oldPassword))
			return res.status(401).json({ message: 'Old password is incorrect' })

		await user.update({ password: md5(newPassword) })
		res.json({ message: 'Password changed successfully' })
	} catch (err) {
		res.status(500).json({ message: 'Server error', error: err.message })
	}
}