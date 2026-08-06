import {
	Match,
	MatchPlayer,
	Team,
	TeamMember,
	Tournament,
	TournamentTeam,
} from "./models/index.js"

(async () => {
	const models = [Match, MatchPlayer, Team, TeamMember, Tournament, TournamentTeam]
	for (const model of models) {
		console.log("model -> ", model.name)
		await model.sync({ alter: true })
	}
	console.log("Migration finished successfully.")
})()
