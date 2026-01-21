import User from "../classes/User.js";

export type BunSocketType = Bun.ServerWebSocket<{ username: string, user:User }>
