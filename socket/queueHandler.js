import { Match, MatchPlayer } from '../models/index.js'
import { createLobby } from "./lobbyHandler.js"

const QUEUE_SIZE = 2
const TEAM_SIZE = QUEUE_SIZE / 2

let queue = []

export async function initQueueHandlers(io, socket) {
	socket.on('queue:join', async () => {
		const alreadyInQueue = queue.some((s) => s.userId === socket.userId)
		if (alreadyInQueue) {
			socket.emit('queue:error', { message: 'Already in queue' })
			return
		}

		queue.push(socket)
		console.log(`➕ ${socket.username} joined queue (${queue.length}/${QUEUE_SIZE})`)

		socket.emit('queue:joined', { position: queue.length, total: QUEUE_SIZE })

		queue.forEach((s) => {
			s.emit("queue:update", { current: queue.length, total: QUEUE_SIZE })
		})

		if (queue.length >= QUEUE_SIZE) {
			await startLobby(io, queue.splice(0, QUEUE_SIZE))
		}
	})


	socket.on("queue:leave", () => {
		queue = queue.filter((s) => s.userId !== socket.userId)
	})
}

async function startLobby(io, players) {
	console.log(`🎮 Starting lobby with ${players.length} players`)

	const shuffled = [...players].sort(() => Math.random() - 0.5)
	const teamA = shuffled.slice(0, TEAM_SIZE)
	const teamB = shuffled.slice(TEAM_SIZE)

	const match = await Match.create({ status: "pending" })

	const matchPlayers = [
		...teamA.map((s) => ({ matchId: match.id, userId: s.userId, team: 'A' })),
		...teamB.map((s) => ({ matchId: match.id, userId: s.userId, team: 'B' }))
	]
	await MatchPlayer.bulkCreate(matchPlayers)

	const roomName = `match:${match.id}`
	players.forEach((s) => s.join(roomName))

	const teamAData = teamA.map((s) => ({ userId: s.userId, username: s.username }))
	const teamBData = teamB.map((s) => ({ userId: s.userId, username: s.username }))

	createLobby(match.id, teamAData, teamBData)

	io.to(roomName).emit('lobby:found', {
		matchId: match.id,
		teamA: teamA.map((s) => ({ userId: s.userId, username: s.username })),
		teamB: teamB.map((s) => ({ userId: s.userId, username: s.username }))
	})
}