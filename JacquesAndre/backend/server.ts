import Fastify from "fastify";
import { FastifyInstance } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import sanitizeHtml from "sanitize-html"
import cors from "@fastify/cors"
import fs from "fs"
import { fileURLToPath } from 'url';
import path from 'path';
const MAX_MESSAGE_LENGTH = 150
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Lobby from "./classes/Lobby.js"
import { json_parse } from "../shared/json_wrapper.ts"

const app: FastifyInstance = Fastify({
	  https: {
		key: fs.readFileSync(path.join(__dirname, "cert/key.pem")),
		cert: fs.readFileSync(path.join(__dirname, "cert/cert.pem")),
  }
})

await app.register(cors, {
	origin: "https://localhost:5173",
	credentials: true
})

const lobby = new Lobby()

await app.register(fastifyWebsocket)


app.get("/api/hello", (req, reply)=>{
	reply.send({type:"message", message:"hello"})
})

app.get("/api/lobby", (req, reply)=>{
	reply.send(lobby)
})

app.get("/api/user", (req, reply)=>{
	const query : any = req.query
	const { userId } = query
	const cleanId = sanitizeHtml(userId)
	const user = lobby.getUser(sanitizeHtml(cleanId))
	if (!user) return reply.code(403).send({error:`userId ${cleanId} invalid`})
	return reply.send({userId:cleanId, pseudo:user.pseudo})
})

app.post("/api/lobby", (req, reply)=>{
	const body : any = req.body
	const { pseudo } = body
	const cleanPseudo = sanitizeHtml(pseudo)
	const payload = lobby.addUser(cleanPseudo)
	if (payload.id === '0') return reply.code(403).send({error:`${cleanPseudo} already taken`})
	return reply.send(payload)
})

app.delete("/api/lobby", (req, reply)=>{
	const body : any = req.body
	const { userId } = body
	const cleanId = sanitizeHtml(userId)
	const user = lobby.getUser(cleanId)
	if (!user) return reply.code(403).send({error:`userId ${cleanId} invalid`})
	lobby.removeUser(user)
	reply.send({success: true})
})

app.get("/api/ws", { websocket: true}, (socket, req)=>{
	const query : any = req.query
	const { userId } = query
	const cleanId = sanitizeHtml(userId)
	console.log(`Connexion avec userId='${cleanId}'`)
	const user = lobby.getUser(cleanId)
	if (!user) return socket.close()
	lobby.refreshWebsocket(cleanId, socket)
	lobby.broadcast({})
	socket.on("close", ()=> lobby.broadcast({}))
	socket.on("message", (raw : any)=>{
			const rawString = sanitizeHtml(raw.toString());
			// Vérifier la taille maximale
            if (rawString.length > MAX_MESSAGE_LENGTH) {
                console.warn(`Message too long from ${cleanId}, ignored`);
                socket.send(JSON.stringify({ type: "error", text: `message too long (${MAX_MESSAGE_LENGTH} bytes max for the json)` }));
                return;
            }
			const msg = json_parse(rawString)
			if (!msg)
			{
				console.warn(`Json invalid from ${cleanId}, ignored`);
                socket.send(JSON.stringify({ type: "error", text: `Invalid json format` }));
                return;
			}
			lobby.handleMessage(user, msg)
		})
})

const PORT = 3000

// Démarrer Fastify
const start = async () => {
	await app.listen({ port: PORT, host : "0.0.0.0" })
	console.log(`✅ Backend HTTPS/WSS sur https://localhost:${PORT}`)
};
start();
