import "dotenv/config"
import express from "express"
import { createServer } from "http"
import morgan from "morgan"
// import routes from "./routes/index.js"
import authRoutes from "./routes/authRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import { initSocket } from "./socket/index.js"


import "./migrate.js"

const app = express()
const { PORT } = process.env

app.use(morgan("dev"))
app.use(express.json())
app.use("/uploads", express.static("uploads"))

app.use("/api/profile", profileRoutes)
app.use("/api/auth", authRoutes)

const server = createServer(app)

initSocket(server)

server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`)
})
