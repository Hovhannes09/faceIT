import { DataTypes } from 'sequelize'
import sequelize from '../src/db.js'

const TournamentTeam = sequelize.define('TournamentTeam', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	seed: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	eliminatedRound: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
}, {
	tableName: 'tournament_teams',
	timestamps: true,
})

export default TournamentTeam