import { Users, Match, MatchPlayer } from "../models/index.js"
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

export const renderLobby = (req, res) => {
	res.render("lobby", {
		currentUser: req.currentUser,
		matchId: req.params.matchId,
		token: req.cookies.token,
	})
}

export const renderProfile = async (req, res) => {
	try {
		const currentUser = req.currentUser

		const rows = await MatchPlayer.findAll({
			where: { userId: currentUser.id },
			include: Match,
			order: [["createdAt", "DESC"]],
		})

		const finished = rows.filter((mp) => mp.Match && mp.Match.status === "finished")

		const history = finished.map((mp) => {
			const m = mp.Match
			const isTeamA = mp.team === "A"
			return {
				matchId: m.id,
				map: m.mapPlayed,
				myScore: isTeamA ? m.scoreTeamA : m.scoreTeamB,
				oppScore: isTeamA ? m.scoreTeamB : m.scoreTeamA,
				won: m.winnerTeam === mp.team,
				delta: mp.eloBefore != null && mp.eloAfter != null ? mp.eloAfter - mp.eloBefore : null,
				date: m.updatedAt,
			}
		})

		const wins = history.filter((h) => h.won).length
		const stats = {
			matches: history.length,
			wins,
			losses: history.length - wins,
			winrate: history.length ? Math.round((wins / history.length) * 100) : 0,
		}

		res.render("profile", {
			currentUser,
			stats,
			history: history.slice(0, 10), // последние 10 матчей
			level: Math.min(10, Math.floor(currentUser.elo / 400) + 1), // та же формула, что в лидерборде
			token: req.cookies.token,
		})
	} catch (err) {
		console.error(err)
		res.status(500).send("Server error")
	}
}
