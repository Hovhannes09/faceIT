import { DataTypes } from 'sequelize'
import sequelize from '../src/db.js'

const Match = sequelize.define('Match', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	status: {
		type: DataTypes.ENUM('pending', 'veto', 'ongoing', 'finished', 'cancelled'),
		defaultValue: 'pending',
	},
	mapPlayed: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	scoreTeamA: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	scoreTeamB: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	proofScreenshot: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	winnerTeam: {
		type: DataTypes.ENUM('A', 'B'),
		allowNull: true,
	},
}, {
	tableName: 'matches',
	timestamps: true,
})

export default Match