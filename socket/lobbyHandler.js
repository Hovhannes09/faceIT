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
	console.log(`📦 Lobby created for match ${matchId}`)
}

function buildVetoOrder(teamA, teamB) {
	const captainA = teamA[0].userId
	const captainB = teamB[0].userId
	return [captainA, captainB, captainA, captainB, captainA, captainB]
}

function buildSnapshot(lobby, matchId) {
	return {
		matchId,
		teamA: lobby.teamA,
		teamB: lobby.teamB,
		readyUserIds: Array.from(lobby.ready),
		vetoStarted: lobby.vetoStarted,
		mapPool: lobby.mapPool,
		bannedMaps: lobby.bannedMaps,
		currentTurnUserId: lobby.vetoStarted ? lobby.vetoOrder[lobby.vetoIndex] : null,
	}
}

export function initLobbyHandlers(io, socket) {
	socket.on("lobby:enter", async ({ matchId }) => {
		const lobby = lobbies.get(matchId)

		if (lobby) {
			socket.join(`match:${matchId}`)
			socket.emit("lobby:state", buildSnapshot(lobby, matchId))
			return
		}

		const match = await Match.findByPk(matchId)
		if (!match) {
			return socket.emit("lobby:error", { message: "Match not found" })
		}

		socket.join(`match:${matchId}`)
		socket.emit("lobby:finished_state", {
			matchId,
			status: match.status,
			mapPlayed: match.mapPlayed,
			scoreTeamA: match.scoreTeamA,
			scoreTeamB: match.scoreTeamB,
		})
	})

	socket.on("lobby:ready", ({ matchId }) => {
		const lobby = lobbies.get(matchId)
		if (!lobby) return socket.emit("lobby:error", { message: "Lobby not found" })

		lobby.ready.add(socket.userId)

		const room = `match:${matchId}`
		io.to(room).emit("lobby:ready_update", {
			readyUserIds: Array.from(lobby.ready),
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