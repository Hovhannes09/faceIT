import { Match, MatchPlayer, Users } from "../models/index.js"
import { calculateElo } from "../utils/elo.js"

export const updateMatchScore = async (req, res) => {
	const { matchId } = req.params
	const { scoreTeamA, scoreTeamB } = req.body

	try {
		const match = await Match.findByPk(matchId)
		if (!match) {
			return res.status(404).json({ message: "Match not found" })
		}

		if (match.status === "finished") {
			return res.status(400).json({ message: "Result already submitted" })
		}

		const winnerTeam = scoreTeamA > scoreTeamB ? "A" : "B"

		const matchPlayers = await MatchPlayer.findAll({
			where: { matchId },
			include: Users,
		})

		if (matchPlayers.length === 0) {
			return res.status(400).json({ message: "No players found for this match" })
		}

		const teamAPlayers = matchPlayers.filter((mp) => mp.team === "A")
		const teamBPlayers = matchPlayers.filter((mp) => mp.team === "B")

		const avgEloTeamA =
			teamAPlayers.reduce((sum, mp) => sum + mp.Users.elo, 0) / teamAPlayers.length
		const avgEloTeamB =
			teamBPlayers.reduce((sum, mp) => sum + mp.Users.elo, 0) / teamBPlayers.length

		for (const mp of teamAPlayers) {
			const newElo = calculateElo(mp.Users.elo, avgEloTeamB, winnerTeam === "A")
			mp.eloBefore = mp.Users.elo
			mp.eloAfter = newElo
			await mp.save()

			mp.Users.elo = newElo
			await mp.Users.save()
		}

		for (const mp of teamBPlayers) {
			const newElo = calculateElo(mp.Users.elo, avgEloTeamA, winnerTeam === "B")
			mp.eloBefore = mp.Users.elo
			mp.eloAfter = newElo
			await mp.save()

			mp.Users.elo = newElo
			await mp.Users.save()
		}

		match.scoreTeamA = scoreTeamA
		match.scoreTeamB = scoreTeamB
		match.winnerTeam = winnerTeam
		match.status = "finished"
		await match.save()

		res.status(200).json({
			message: "Match result submitted and ELO updated",
			match: {
				id: match.id,
				scoreTeamA,
				scoreTeamB,
				winnerTeam,
				status: match.status,
			},
		})
	} catch (error) {
		console.error("Error updating match score:", error)
		res.status(500).json({ message: "Internal server error" })
	}
}