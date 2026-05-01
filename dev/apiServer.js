import "dotenv/config"
import express from "express"
import cors from "cors"

import createUserHandler from "../api/users/create.js"
import deleteUserHandler from "../api/users/delete.js"
import addMemberHandler from "../api/institutions/add-member.js"
import syncToSchoolsHandler from "../api/institutions/sync-to-schools.js"

const app = express()

app.use(cors())
app.use(express.json({ limit: "2mb" }))

app.post("/api/users/create", (req, res) => createUserHandler(req, res))
app.delete("/api/users/delete", (req, res) => deleteUserHandler(req, res))

app.post("/api/institutions/add-member", (req, res) => addMemberHandler(req, res))
app.post("/api/institutions/sync-to-schools", (req, res) => syncToSchoolsHandler(req, res))

const port = Number(process.env.API_DEV_PORT || 3001)
app.listen(port, () => {
  console.log(`[dev/apiServer] Listening on http://localhost:${port}`)
})

