import { DataTypes } from 'sequelize'
import sequelize from '../src/db.js'

const MatchPlayer = sequelize.define('MatchPlayer', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	team: {
		type: DataTypes.ENUM('A', 'B'),
		allowNull: false,
	},
	eloBefore: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	eloAfter: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
}, {
	tableName: 'match_players',
	timestamps: true,
})

export default MatchPlayer