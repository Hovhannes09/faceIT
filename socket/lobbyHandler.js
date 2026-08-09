import { Match } from "../models/index.js"

const MAP_POOL = ["Dust2", "Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Vertigo"]

const lobbies = new Map()

export function createLobby(matchId, teamA, teamB) {
	lobbies.set(matchId, {
		teamA,
		teamB,
		ready: new Set(),
		mapPool: [...MAP_POOL],
		bannedMaps: [],
		vetoOrder: buildVetoOrder(teamA, teamB),
		vetoIndex: 0,
		vetoStarted: false,
	})
	console.log(`📦 Lobby created for match ${matchId}. Players:`, [...teamA, ...teamB].map(p => p.userId))
}

function buildVetoOrder(teamA, teamB) {
	const captainA = teamA[0].userId
	const captainB = teamB[0].userId
	return [captainA, captainB, captainA, captainB, captainA, captainB]
}

export function initLobbyHandlers(io, socket) {
	socket.on("lobby:ready", ({ matchId }) => {
		console.log(`🎯 ${socket.username} (userId ${socket.userId}) pressed ready for match ${matchId}`)

		const lobby = lobbies.get(matchId)
		if (!lobby) {
			console.log(`❌ Lobby ${matchId} not found in memory. Available lobbies:`, Array.from(lobbies.keys()))
			return socket.emit("lobby:error", { message: "Lobby not found" })
		}

		lobby.ready.add(socket.userId)

		const room = `match:${matchId}`
		io.to(room).emit("lobby:ready_update", {
			readyCount: lobby.ready.size,
			total: lobby.teamA.length + lobby.teamB.length,
		})

		const allPlayers = [...lobby.teamA, ...lobby.teamB]
		const allReady = allPlayers.every((p) => lobby.ready.has(p.userId))

		if (allReady && !lobby.vetoStarted) {
			lobby.vetoStarted = true
			io.to(room).emit("lobby:all_ready")
			startVeto(io, matchId)
		}
	})

	socket.on("veto:ban", async ({ matchId, map }) => {
		const lobby = lobbies.get(matchId)
		if (!lobby) return socket.emit("veto:error", { message: "Lobby not found" })

		const room = `match:${matchId}`
		const currentTurnUserId = lobby.vetoOrder[lobby.vetoIndex]

		if (socket.userId !== currentTurnUserId) {
			socket.emit("veto:error", { message: "Not your turn" })
			return
		}

		if (!lobby.mapPool.includes(map)) {
			socket.emit("veto:error", { message: "Invalid map or already banned" })
			return
		}

		lobby.mapPool = lobby.mapPool.filter((m) => m !== map)
		lobby.bannedMaps.push(map)
		lobby.vetoIndex++

		io.to(room).emit("veto:update", {
			bannedMaps: lobby.bannedMaps,
			remainingMaps: lobby.mapPool,
		})

		if (lobby.mapPool.length === 1) {
			await finishVeto(io, matchId)
		} else {
			announceTurn(io, matchId)
		}
	})
}

function startVeto(io, matchId) {
	const lobby = lobbies.get(matchId)
	const room = `match:${matchId}`
	io.to(room).emit("veto:start", { mapPool: lobby.mapPool })
	announceTurn(io, matchId)
}

function announceTurn(io, matchId) {
	const lobby = lobbies.get(matchId)
	const room = `match:${matchId}`
	const currentTurnUserId = lobby.vetoOrder[lobby.vetoIndex]
	io.to(room).emit("veto:turn", { userId: currentTurnUserId })
}

async function finishVeto(io, matchId) {
	const lobby = lobbies.get(matchId)
	const room = `match:${matchId}`
	const finalMap = lobby.mapPool[0]

	await Match.update(
		{ status: "ongoing", mapPlayed: finalMap },
		{ where: { id: matchId } }
	)

	io.to(room).emit("veto:finished", { map: finalMap })

	lobbies.delete(matchId)
}