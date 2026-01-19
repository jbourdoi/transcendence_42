import { BunSocketType } from '../types/bunSocket.type'
import { ClientType } from '../types/client.type'

export let clientsList: Set<ClientType> = new Set<ClientType>()
export const clientsSocket = new Set<BunSocketType>()
