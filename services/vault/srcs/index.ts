import { generateKeys } from "./generateKeys.ts";
import { routes } from "./routes/handler.route.ts";
import { log } from "./logs.ts";

async function main() {
    await generateKeys();
    Bun.serve({
        port: Number(process.env.VAULT_API_PORT),
        routes,
        fetch() {
            return new Response("Route not Known", { status: 404 });
        }
    });
    log(`Listening on http://localhost:${process.env.VAULT_API_PORT}`, 'info');
}

main();