import { WebSocket } from "ws"

import { json_stringify } from "../../shared/json_wrapper.ts"

export default class User
{
  public pseudo:string
  public socket:WebSocket | undefined
  public status: string
  constructor(
    public readonly id: string,
    pseudo: string | undefined,
  )
  {
    this.pseudo = pseudo?.trim() || `Player-${Math.floor(Math.random() * 1000)}`
    this.socket = undefined
    this.status = 'chat'
    console.log(`new user ${this.id} ${this.pseudo}`)
  }

  send(data: any)
  {
    if (this.socket?.readyState === WebSocket.OPEN)
    {
      this.socket?.send(json_stringify(data));
    }
  }

  close(reason?: string)
  {
    this.socket?.close(1000, reason);
  }

  toJSON()
  {
    return {
      pseudo: this.pseudo,
      connected: this.socket?.readyState === WebSocket.OPEN,
      status: this.status
    }
  }
}
