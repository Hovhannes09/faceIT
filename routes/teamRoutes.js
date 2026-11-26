import { Router } from "express"
import {
	createTeam,
	inviteMember,
	acceptInvite,
	declineInvite,
	kickMember,
	leaveTeam,
	transferCaptain,
	deleteTeam,
} from "../controllers/teamController.js"
import authorization from "../middlewares/authMiddleware.js"
import validate from "../middlewares/validate.js"
import { createTeamSchema, inviteSchema, transferSchema } from "../validators/teamValidator.js"

const router = Router()

router.use(authorization)

router.post("/", validate(createTeamSchema), createTeam)

router.post("/invites/:inviteId/accept", acceptInvite)
router.post("/invites/:inviteId/decline", declineInvite)

router.post("/:teamId/invite", validate(inviteSchema), inviteMember)
router.post("/:teamId/leave", leaveTeam)
router.put("/:teamId/captain", validate(transferSchema), transferCaptain)
router.delete("/:teamId/members/:userId", kickMember)
router.delete("/:teamId", deleteTeam)

export default router