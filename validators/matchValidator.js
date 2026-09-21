import joi from "joi"

export const submitResultSchema = joi.object({
	scoreTeamA: joi.number().integer().min(0).required(),
	scoreTeamB: joi.number().integer().min(0).required(),
}).custom((value, helpers) => {
	if (value.scoreTeamA === value.scoreTeamB) {
		return helpers.error("any.invalid")
	}
	return value
}).messages({
	"any.invalid": "Match cannot end in a draw",
})