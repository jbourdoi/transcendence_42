import { WebSocketManager } from "./WebSocketManager.ts";

WebSocketManager.getInstance().on("chat", (msg) => {
    console.log("Chat message:", msg);
});

