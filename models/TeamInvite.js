import { DataTypes } from "sequelize"
import sequelize from "../src/db.js"

const TeamInvite = sequelize.define(
	"TeamInvite",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		status: {
			type: DataTypes.ENUM("pending", "accepted", "declined"),
			allowNull: false,
			defaultValue: "pending",
		},
	},
	{
		tableName: "team_invites",
		timestamps: true,
	}
)

export default TeamInvite