import { DataTypes } from 'sequelize'
import sequelize from '../src/db.js'

const Tournament = sequelize.define('Tournament', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	format: {
		type: DataTypes.ENUM('single_elimination'),
		defaultValue: 'single_elimination',
	},
	status: {
		type: DataTypes.ENUM('registration', 'ongoing', 'finished'),
		defaultValue: 'registration',
	},
	maxTeams: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
}, {
	tableName: 'tournaments',
	timestamps: true,
})

export default Tournament