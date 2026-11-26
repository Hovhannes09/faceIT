import { Op } from "sequelize"
import { sequelize, Team, TeamMember, TeamInvite, Users } from "../models/index.js"
import { emitToUser } from "../socket/index.js"

export const TEAM_MAX = 5 // 5v5


function parseId(value) {
	const id = Number(value)
	return Number.isInteger(id) && id > 0 ? id : null
}

async function loadTeamAsCaptain(req, res) {
	const teamId = parseId(req.params.teamId)
	if (!teamId) {
		res.status(400).json({ message: "Invalid team id" })
		return null
	}

	const team = await Team.findByPk(teamId)
	if (!team) {
		res.status(404).json({ message: "Team not found" })
		return null
	}

	if (team.captainId !== req.userId) {
		res.status(403).json({ message: "Only the team captain can do this" })
		return null
	}

	return team
}

function serverError(res, err) {
	console.error(err)
	res.status(500).json({ message: "Internal server error" })
}

export const createTeam = async (req, res) => {
	try {
		const name = req.body.name.trim()

		const alreadyInTeam = await TeamMember.findOne({ where: { userId: req.userId } })
		if (alreadyInTeam) {
			return res.status(409).json({ message: "You are already in a team" })
		}

		const nameTaken = await Team.findOne({ where: { name } })
		if (nameTaken) {
			return res.status(409).json({ message: "Team name is already taken" })
		}

		const team = await sequelize.transaction(async (transaction) => {
			const created = await Team.create({ name, captainId: req.userId }, { transaction })
			await TeamMember.create(
				{ teamId: created.id, userId: req.userId, role: "captain" },
				{ transaction }
			)
			return created
		})

		res.status(201).json({ message: "Team created", team: { id: team.id, name: team.name } })
	} catch (err) {
		if (err.name === "SequelizeUniqueConstraintError") {
			return res.status(409).json({ message: "Team name is already taken" })
		}
		serverError(res, err)
	}
}

export const inviteMember = async (req, res) => {
	try {
		const team = await loadTeamAsCaptain(req, res)
		if (!team) return

		const username = req.body.username.trim()
		const target = await Users.findOne({ where: { username } })
		if (!target) {
			return res.status(404).json({ message: "Player not found" })
		}
		if (target.id === req.userId) {
			return res.status(400).json({ message: "You can't invite yourself" })
		}

		const targetTeam = await TeamMember.findOne({ where: { userId: target.id } })
		if (targetTeam) {
			return res.status(409).json({ message: "Player is already in a team" })
		}

		const members = await TeamMember.count({ where: { teamId: team.id } })
		if (members >= TEAM_MAX) {
			return res.status(409).json({ message: "Team is full" })
		}

		const duplicate = await TeamInvite.findOne({
			where: { teamId: team.id, inviteeId: target.id, status: "pending" },
		})
		if (duplicate) {
			return res.status(409).json({ message: "Invite has already been sent" })
		}

		const invite = await TeamInvite.create({
			teamId: team.id,
			inviteeId: target.id,
			inviterId: req.userId,
		})

		try {
			emitToUser(target.id, "team:invite", {
				inviteId: invite.id,
				teamId: team.id,
				teamName: team.name,
			})
		} catch (err) {
			console.error("emitToUser failed:", err.message)
		}

		res.status(201).json({ message: "Invite sent" })
	} catch (err) {
		serverError(res, err)
	}
}

export const acceptInvite = async (req, res) => {
	try {
		const inviteId = parseId(req.params.inviteId)
		if (!inviteId) return res.status(400).json({ message: "Invalid invite id" })

		const result = await sequelize.transaction(async (transaction) => {
			const invite = await TeamInvite.findOne({
				where: { id: inviteId, inviteeId: req.userId, status: "pending" },
				transaction,
			})
			if (!invite) {
				return { code: 404, message: "Invite not found or already handled" }
			}

			const inTeam = await TeamMember.findOne({ where: { userId: req.userId }, transaction })
			if (inTeam) {
				return { code: 409, message: "You are already in a team" }
			}

			const members = await TeamMember.count({ where: { teamId: invite.teamId }, transaction })
			if (members >= TEAM_MAX) {
				return { code: 409, message: "Team is full" }
			}

			await TeamMember.create(
				{ teamId: invite.teamId, userId: req.userId, role: "member" },
				{ transaction }
			)

			await TeamInvite.update(
				{ status: "declined" },
				{
					where: { inviteeId: req.userId, status: "pending", id: { [Op.ne]: invite.id } },
					transaction,
				}
			)

			invite.status = "accepted"
			await invite.save({ transaction })

			return { code: 200, teamId: invite.teamId }
		})

		if (result.code !== 200) {
			return res.status(result.code).json({ message: result.message })
		}
		res.json({ message: "You joined the team", teamId: result.teamId })
	} catch (err) {
		serverError(res, err)
	}
}

export const declineInvite = async (req, res) => {
	try {
		const inviteId = parseId(req.params.inviteId)
		if (!inviteId) return res.status(400).json({ message: "Invalid invite id" })

		const [updated] = await TeamInvite.update(
			{ status: "declined" },
			{ where: { id: inviteId, inviteeId: req.userId, status: "pending" } }
		)
		if (!updated) {
			return res.status(404).json({ message: "Invite not found or already handled" })
		}

		res.json({ message: "Invite declined" })
	} catch (err) {
		serverError(res, err)
	}
}

export const kickMember = async (req, res) => {
	try {
		const team = await loadTeamAsCaptain(req, res)
		if (!team) return

		const userId = parseId(req.params.userId)
		if (!userId) return res.status(400).json({ message: "Invalid user id" })
		if (userId === req.userId) {
			return res.status(400).json({ message: "Captain can't kick themselves" })
		}

		const removed = await TeamMember.destroy({ where: { teamId: team.id, userId } })
		if (!removed) {
			return res.status(404).json({ message: "Player is not in this team" })
		}

		res.json({ message: "Player removed from the team" })
	} catch (err) {
		serverError(res, err)
	}
}

export const leaveTeam = async (req, res) => {
	try {
		const teamId = parseId(req.params.teamId)
		if (!teamId) return res.status(400).json({ message: "Invalid team id" })

		const membership = await TeamMember.findOne({ where: { teamId, userId: req.userId } })
		if (!membership) {
			return res.status(404).json({ message: "You are not in this team" })
		}

		const team = await Team.findByPk(teamId)
		if (team && team.captainId === req.userId) {
			return res
				.status(400)
				.json({ message: "Captain can't leave: transfer captaincy or delete the team" })
		}

		await membership.destroy()
		res.json({ message: "You left the team" })
	} catch (err) {
		serverError(res, err)
	}
}

export const transferCaptain = async (req, res) => {
	try {
		const team = await loadTeamAsCaptain(req, res)
		if (!team) return

		const newCaptainId = Number(req.body.userId)
		if (newCaptainId === req.userId) {
			return res.status(400).json({ message: "You are already the captain" })
		}

		const target = await TeamMember.findOne({ where: { teamId: team.id, userId: newCaptainId } })
		if (!target) {
			return res.status(404).json({ message: "Player is not in this team" })
		}

		await sequelize.transaction(async (transaction) => {
			await TeamMember.update(
				{ role: "member" },
				{ where: { teamId: team.id, userId: req.userId }, transaction }
			)
			await TeamMember.update(
				{ role: "captain" },
				{ where: { teamId: team.id, userId: newCaptainId }, transaction }
			)
			team.captainId = newCaptainId
			await team.save({ transaction })
		})

		res.json({ message: "Captaincy transferred" })
	} catch (err) {
		serverError(res, err)
	}
}

export const deleteTeam = async (req, res) => {
	try {
		const team = await loadTeamAsCaptain(req, res)
		if (!team) return

		await sequelize.transaction(async (transaction) => {
			await TeamInvite.destroy({ where: { teamId: team.id }, transaction })
			await TeamMember.destroy({ where: { teamId: team.id }, transaction })
			await team.destroy({ transaction })
		})

		res.json({ message: "Team deleted" })
	} catch (err) {
		serverError(res, err)
	}
}