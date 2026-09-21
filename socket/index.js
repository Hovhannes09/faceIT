import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import Users from "../models/Users.js"
import { initQueueHandlers } from "./queueHandler.js"
import { initLobbyHandlers } from "./lobbyHandler.js"

const { JWT_SECRET } = process.env


const onlineUsers = new Map()

export function initSocket(server) {
	const io = new Server(server, {
		cors: {
			origin: "*",
		},
	})

	io.use(async (socket, next) => {
		try {
			const token = socket.handshake.auth?.token

			if (!token) {
				return next(new Error("Unauthorized"))
			}

			const decoded = jwt.verify(token, JWT_SECRET)
			if (!decoded?.userId) {
				return next(new Error("Unauthorized"))
			}

			const user = await Users.findByPk(decoded.userId)
			if (!user) {
				return next(new Error("Unauthorized"))
			}

			socket.userId = user.id
			socket.username = user.username

			next()
		} catch (err) {
			next(new Error("Unauthorized"))
		}
	})

	io.on("connection", (socket) => {
		console.log(`🟢 ${socket.username} connected (${socket.id})`)

		initQueueHandlers(io, socket)
		initLobbyHandlers(io, socket)

		if (!onlineUsers.has(socket.userId)) {
			onlineUsers.set(socket.userId, new Set())
		}
		onlineUsers.get(socket.userId).add(socket.id)

		if (onlineUsers.get(socket.userId).size === 1) {
			io.emit("user:online", { userId: socket.userId, username: socket.username })
		}

		socket.emit("online:list", Array.from(onlineUsers.keys()))

		socket.on("disconnect", () => {
			console.log(`🔴 ${socket.username} disconnected (${socket.id})`)

			const userSockets = onlineUsers.get(socket.userId)
			if (userSockets) {
				userSockets.delete(socket.id)

				if (userSockets.size === 0) {
					onlineUsers.delete(socket.userId)
					io.emit("user:offline", { userId: socket.userId })
				}
			}
		})
	})

	return io
}

export { onlineUsers }