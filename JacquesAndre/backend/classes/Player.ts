import User from "./User.js"

export class Player
{
	readonly index: number
	readonly nbPlayer : number
	readonly defaultAngle: number
	readonly minAngle: number
	readonly maxAngle: number
	readonly user: User
	paddleSize: number
	angle: number
	score: number
	pause: boolean
	key: string

	constructor(index: number, nbPlayer: number, user: User)
	{
		this.index = index
		this.nbPlayer = nbPlayer
		this.paddleSize = 0.2 // radians (~11.5°)
		if (index) this.paddleSize = Math.PI / (nbPlayer)
		this.user = user
		this.key = "none"
		this.pause = false
		this.score = 5
		this.minAngle = (Math.PI / 2) + (2 * this.index * Math.PI / this.nbPlayer)
		this.maxAngle = (Math.PI / 2) + (2 * (this.index + 1) * Math.PI / this.nbPlayer)
		this.defaultAngle = (this.minAngle + this.maxAngle) / 2
		this.angle = this.defaultAngle
		console.log(`created player${index} angle ${this.angle} min ${this.minAngle} max ${this.maxAngle}`)
		user.status = "game"
	}

	move(direction: "-" | "+")
	{
		if (direction === "-") this.angle += 0.05
		if (direction === "+") this.angle -= 0.05

		if (this.angle - this.paddleSize < this.minAngle) this.angle = this.minAngle + this.paddleSize
		if (this.angle + this.paddleSize > this.maxAngle) this.angle = this.maxAngle - this.paddleSize

	}

	togglePause()
	{
		this.pause = !this.pause
		if (this.pause) console.log(`⏸️ Joueur ${this.user.pseudo} toggle pause`)
	}

	resetAngle()
	{
		this.angle = this.defaultAngle
	}
}
