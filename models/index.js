import sequelize from '../src/db.js'
import Match from './Match.js'
import MatchPlayer from './MatchPlayer.js'
import Team from './Team.js'
import TeamMember from './TeamMember.js'
import Tournament from './Tournament.js'
import TournamentTeam from './TournamentTeam.js'
import Users from './Users.js'

// ---- User <-> Team -- TeamMember ----
Users.belongsToMany(Team, { through: TeamMember, foreignKey: 'userId' })
Team.belongsToMany(Users, { through: TeamMember, foreignKey: 'teamId' })

TeamMember.belongsTo(Users, { foreignKey: 'userId' })
TeamMember.belongsTo(Team, { foreignKey: 'teamId' })

// ---- Team.captainId -> User.id ----
Team.belongsTo(Users, { as: 'captain', foreignKey: 'captainId' })

// ---- User <-> Match -- MatchPlayer ----
Users.belongsToMany(Match, { through: MatchPlayer, foreignKey: 'userId' })
Match.belongsToMany(Users, { through: MatchPlayer, foreignKey: 'matchId' })

MatchPlayer.belongsTo(Users, { foreignKey: 'userId' })
MatchPlayer.belongsTo(Match, { foreignKey: 'matchId' })

// ---- Team <-> Tournament -- TournamentTeam ----
Team.belongsToMany(Tournament, { through: TournamentTeam, foreignKey: 'teamId' })
Tournament.belongsToMany(Team, { through: TournamentTeam, foreignKey: 'tournamentId' })

TournamentTeam.belongsTo(Team, { foreignKey: 'teamId' })
TournamentTeam.belongsTo(Tournament, { foreignKey: 'tournamentId' })

export {
	Match,
	MatchPlayer, sequelize, Team,
	TeamMember, Tournament,
	TournamentTeam, Users
}
