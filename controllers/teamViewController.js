import { Team, TeamMember, TeamInvite, Users } from "../models/index.js"
import { TEAM_MAX } from "./teamController.js"

const userOf = (row) => row.Users || row.User

export const renderTeams = async (req, res) => {
	try {
		const me = req.currentUser

		const myMembership = await TeamMember.findOne({ where: { userId: me.id } })
		const myTeam = myMembership ? await Team.findByPk(myMembership.teamId) : null

		const invites = await TeamInvite.findAll({
			where: { inviteeId: me.id, status: "pending" },
			include: [Team, { model: Users, as: "inviter", attributes: ["id", "username"] }],
			order: [["createdAt", "DESC"]],
		})

		const teams = await Team.findAll({
			include: [{ model: Users, as: "captain", attributes: ["id", "username"] }],
			order: [["createdAt", "DESC"]],
			limit: 60,
		})

		const stats = new Map()
		if (teams.length) {
			const rows = await TeamMember.findAll({
				where: { teamId: teams.map((t) => t.id) },
				include: { model: Users, attributes: ["elo"] },
			})
			for (const row of rows) {
				const s = stats.get(row.teamId) || { count: 0, eloSum: 0 }
				s.count += 1
				s.eloSum += userOf(row)?.elo || 0
				stats.set(row.teamId, s)
			}
		}

		const teamsView = teams.map((t) => {
			const s = stats.get(t.id) || { count: 0, eloSum: 0 }
			return {
				id: t.id,
				name: t.name,
				captain: t.captain ? t.captain.username : "—",
				count: s.count,
				avgElo: s.count ? Math.round(s.eloSum / s.count) : 0,
				isMine: myTeam ? myTeam.id === t.id : false,
			}
		})

		res.render("teams", {
			currentUser: me,
			myTeam,
			invites,
			teams: teamsView,
			TEAM_MAX,
			token: req.cookies.token,
		})
	} catch (err) {
		console.error(err)
		res.status(500).send("Server error")
	}
}

export const renderTeam = async (req, res) => {
	try {
		const me = req.currentUser
		const teamId = Number(req.params.teamId)
		if (!Number.isInteger(teamId) || teamId < 1) return res.redirect("/teams")

		const team = await Team.findByPk(teamId, {
			include: [{ model: Users, as: "captain", attributes: ["id", "username"] }],
		})
		if (!team) return res.redirect("/teams")

		const rows = await TeamMember.findAll({
			where: { teamId },
			include: { model: Users, attributes: ["id", "username", "avatarUrl", "elo"] },
		})

		const members = rows
			.map((row) => {
				const u = userOf(row)
				return {
					userId: row.userId,
					role: row.userId === team.captainId ? "captain" : "member",
					username: u.username,
					avatarUrl: u.avatarUrl,
					elo: u.elo,
				}
			})
			.sort((a, b) => (a.role === "captain" ? -1 : b.role === "captain" ? 1 : b.elo - a.elo))

		const isCaptain = team.captainId === me.id
		const isMember = members.some((m) => m.userId === me.id)
		const myOtherTeam = !isMember
			? await TeamMember.findOne({ where: { userId: me.id } })
			: null

		const pendingInvites = isCaptain
			? await TeamInvite.findAll({
					where: { teamId, status: "pending" },
					include: [{ model: Users, as: "invitee", attributes: ["id", "username"] }],
					order: [["createdAt", "DESC"]],
				})
			: []

		res.render("team", {
			currentUser: me,
			team,
			members,
			pendingInvites,
			isCaptain,
			isMember,
			inOtherTeam: Boolean(myOtherTeam),
			avgElo: members.length
				? Math.round(members.reduce((sum, m) => sum + m.elo, 0) / members.length)
				: 0,
			TEAM_MAX,
			token: req.cookies.token,
		})
	} catch (err) {
		console.error(err)
		res.status(500).send("Server error")
	}
}