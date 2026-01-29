import { UserStore } from "../stores/user.store"
import { json_stringify } from "./json_wrapper"

export type MatchTypeToSave = {
    matchType: 'tournament' | 'classic' | 'duel',
    players: {username: string, gameRes: "win" | "lose"}[]
}

export async function saveMatch(match : MatchTypeToSave)
{
    if (!UserStore.getUserName()) return ;
    
    const res = await fetch('/add_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json_stringify(match)
    })
}