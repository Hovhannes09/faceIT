import sequelize from '../config/db.js'
import User from './User.js'
import Team from './Team.js'
import TeamMember from './TeamMember.js'
import Match from './Match.js'
import MatchPlayer from './MatchPlayer.js'
import Tournament from './Tournament.js'
import TournamentTeam from './TournamentTeam.js'

// ---- User <-> Team -- TeamMember ----
User.belongsToMany(Team, { through: TeamMember, foreignKey: 'userId' })
Team.belongsToMany(User, { through: TeamMember, foreignKey: 'teamId' })

TeamMember.belongsTo(User, { foreignKey: 'userId' })
TeamMember.belongsTo(Team, { foreignKey: 'teamId' })

// ---- Team.captainId -> User.id ----
Team.belongsTo(User, { as: 'captain', foreignKey: 'captainId' })

// ---- User <-> Match -- MatchPlayer ----
User.belongsToMany(Match, { through: MatchPlayer, foreignKey: 'userId' })
Match.belongsToMany(User, { through: MatchPlayer, foreignKey: 'matchId' })

MatchPlayer.belongsTo(User, { foreignKey: 'userId' })
MatchPlayer.belongsTo(Match, { foreignKey: 'matchId' })

// ---- Team <-> Tournament -- TournamentTeam ----
Team.belongsToMany(Tournament, { through: TournamentTeam, foreignKey: 'teamId' })
Tournament.belongsToMany(Team, { through: TournamentTeam, foreignKey: 'tournamentId' })

TournamentTeam.belongsTo(Team, { foreignKey: 'teamId' })
TournamentTeam.belongsTo(Tournament, { foreignKey: 'tournamentId' })

export {
	sequelize,
	User,
	Team,
	TeamMember,
	Match,
	MatchPlayer,
	Tournament,
	TournamentTeam,
}