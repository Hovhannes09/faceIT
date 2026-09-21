import "dotenv/config"
import express from "express"
import { createServer } from "http"
import morgan from "morgan"
import cookieParser from "cookie-parser"
// import routes from "./routes/index.js"
import authRoutes from "./routes/authRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import { initSocket } from "./socket/index.js"
import matchRoutes from "./routes/matchRoutes.js"
import viewRoutes from "./routes/viewRoutes.js"
import localeMiddleware from "./middlewares/localMiddleware.js"


import "./migrate.js"

const app = express()
const { PORT } = process.env

app.set("view engine", "ejs")
app.set("views", "./views")

app.use(morgan("dev"))
app.use(express.json())
app.use("/uploads", express.static("uploads"))
app.use(cookieParser())
app.use(localeMiddleware)
app.use(express.static("public"))

app.use("/api/profile", profileRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/matches", matchRoutes)
app.use("/", viewRoutes)

const server = createServer(app)

initSocket(server)

server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`)
})
 