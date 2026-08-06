import "dotenv/config"
import morgan from "morgan"
import { createServer } from "http"
import express from "express"
// import routes from "./routes/index.js"

import "./migrate.js"

const app = express()

const { PORT } = process.env

app.use(morgan("dev"))
app.use(express.json())

const server = createServer(app)

server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`)
})