import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
// import websocketPlugin from "@fastify/websocket"
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { createGameServer } from "./game.js";
import fs from "fs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({https: {
    key: fs.readFileSync(".\\certs\\key.pem"),
    cert: fs.readFileSync(".\\certs\\cert.pem"),
}});

// fastify.register(websocketPlugin)

// Servir les fichiers statiques (frontend)
fastify.register(fastifyStatic, {
	root: path.join(__dirname, "../public"),
});

// Route principale
fastify.get("/", (_, reply) => {
	reply.sendFile("index.html");
});

// Démarrer Fastify
const start = async () => {

	await fastify.listen({ port: 7777 });
	console.log("✅ Serveur HTTPS/WSS sur https://localhost:7777");

	const wss = new WebSocketServer({ server: fastify.server });
	createGameServer(wss);
  // Attacher le serveur WebSocket sur le même port
};
start();
