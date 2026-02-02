export type Player = {
	pseudo: string,
	score: number,
	ai:boolean,
	angle:number,
	minAngle:number,
	maxAngle:number,
	paddleSize:number
}

export type PlayerColored = Player & {
	bg:string,
	fg:string
}

export type GamePause = {
	type: 'pause'
}

export type GameState = {
	type: 'state'| 'end',
	ball: {dist:number, theta:number, x:number, y:number},
	impacts: any,
	players: Player[],
	changeColor: boolean,
	nbFrame: number
}

export type Countdown = {
	type: 'countdown',
	value: string
}

export type GameDisconnect = {
	type: 'disconnect',
	text: string
}

export type Impact = {
    tImpact: number;      // temps depuis le départ du segment
    impactX: number;      // position X de l'impact
    impactY: number;      // position Y de l'impact
    theta: number;        // angle par rapport au centre
    vx: number;           // vitesse après impact
    vy: number;           // vitesse après impact
}
