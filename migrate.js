import {
	Users,
	Team,
	Tournament,
	TeamMember,
	Match,
	MatchPlayer,
	TournamentTeam,
} from "./models/index.js"

(async () => {
	const models = [Users, Team, Tournament, TeamMember, Match, MatchPlayer, TournamentTeam]
	for (const model of models) {
		console.log("model -> ", model.name)
		await model.sync({ alter: true })
	}
	console.log("Migration finished successfully.")
})()
