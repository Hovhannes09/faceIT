import { Router } from "express"
import { updateMatchScore } from "../controllers/matchController.js"
import validate from "../middlewares/validate.js"
import { submitResultSchema } from "../validators/matchValidator.js"
import authorization from "../middlewares/authMiddleware.js"

const router = Router()

router.put(
	"/:matchId/result",
	authorization,
	validate(submitResultSchema),
	updateMatchScore
)

export default router