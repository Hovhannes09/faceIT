import Joi from "joi"

export const createTeamSchema = Joi.object({
	name: Joi.string()
		.trim()
		.min(3)
		.max(24)
		.pattern(/^[\p{L}\p{N} _.-]+$/u)
		.required(),
})

export const inviteSchema = Joi.object({
	username: Joi.string().trim().min(3).max(30).required(),
})

export const transferSchema = Joi.object({
	userId: Joi.number().integer().positive().required(),
})