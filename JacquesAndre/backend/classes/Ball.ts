export class Ball
{
	readonly defaultX: number;
	readonly defaultY: number;
	x: number;
	y: number;
	vx: number;
	vy: number;

	constructor(defaultX: number, defaultY: number)
	{
		this.defaultX = defaultX
		this.defaultY = defaultY
		this.x = 0
		this.y = 0
		this.vx = 0
		this.vy = 0
		this.reset(0)
	}

	reset(defaultAngle: number)
	{
		this.x = this.defaultX + this.defaultX * (1.5 - Math.random()) / 5
		this.y = this.defaultY + this.defaultY * (1.5 - Math.random()) / 5
		const minV : number = 3;
		const maxV : number = 4;
		const randomV : number = minV + Math.random() * (maxV - minV);
		const randomNoiseAngle : number = - (Math.PI / 6) + Math.random() * (Math.PI / 3)
		defaultAngle += randomNoiseAngle
		this.vx = randomV *  Math.cos(defaultAngle)
		this.vy = randomV * Math.sin(defaultAngle)
	}
}
