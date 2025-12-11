import { arena } from "../../frontend/functions/game.scale.js"
import type { Impact } from "../../types/game.type.js"

export class Ball
{
	x: number;
	y: number;
	vx: number;
	vy: number;

	constructor()
	{
		this.x = 0
		this.y = 0
		this.vx = 0
		this.vy = 0
		this.reset(0)
	}

	reset(defaultAngle: number)
	{
		this.x = arena.centerX * (6.5 - Math.random()) / 5
		this.y =  arena.centerY * (6.5 - Math.random()) / 5
		const minV : number = 2
		const maxV : number = 3
		const randomV : number = minV + Math.random() * (maxV - minV);
		const randomNoiseAngle : number = - (Math.PI / 6) + Math.random() * (Math.PI / 3)
		defaultAngle += randomNoiseAngle
		this.vx = randomV *  Math.cos(defaultAngle)
		this.vy = randomV * Math.sin(defaultAngle)
	}

	predictImpact(hertz:number): Impact[]
	{
		return predictImpacts(this, hertz)
	}

}

interface IBall {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

/**
 * Prédit le prochain impact de la balle sur le cercle
 */
function predictImpactFrom(ball: IBall): Impact | null
{
    const X = ball.x - arena.centerX;
    const Y = ball.y - arena.centerY;
    const vx = ball.vx;
    const vy = ball.vy;
    const R = arena.radius;

    const A = vx * vx + vy * vy;
    const B = 2 * (X * vx + Y * vy);
    const C = X * X + Y * Y - R * R;

    const delta = B * B - 4 * A * C;
    if (delta < 0) return null;

    const sqrtD = Math.sqrt(delta);
    const t1 = (-B - sqrtD) / (2 * A);
    const t2 = (-B + sqrtD) / (2 * A);

    let tImpact = Math.min(t1, t2);
    if (tImpact < 0) tImpact = Math.max(t1, t2);
    if (tImpact < 0) return null;

    const impactX = ball.x + vx * tImpact;
    const impactY = ball.y + vy * tImpact;

    let theta = Math.atan2(impactY - arena.centerY, impactX - arena.centerX);
    if (theta < 0) theta += 2 * Math.PI;

    return { tImpact, impactX, impactY, theta, vx, vy };
}

/**
 * Calcule le vecteur vitesse après rebond sur le cercle
 */
function bounceVelocity(impact: Impact): { vx: number; vy: number }
{
    const nx = (impact.impactX - arena.centerX) / arena.radius;
    const ny = (impact.impactY - arena.centerY) / arena.radius;
    const dot = impact.vx * nx + impact.vy * ny;
    const vx2 = impact.vx - 2 * dot * nx;
    const vy2 = impact.vy - 2 * dot * ny;
    return { vx: vx2, vy: vy2 };
}

/**
 * Calcule les prochains impacts de la balle, en chaîne
 */
function predictImpacts(ball: IBall, hertz: number = 60): Impact[]
{
    const impacts: Impact[] = []
    let currentBall: IBall = { ...ball }

	const maxImpact = 3
    for (let i = 0; i < maxImpact; i++)
	{
        const impact = predictImpactFrom(currentBall)
        if (!impact) break

        impacts.push(impact)
		if (impact.tImpact > hertz) break

        // Calcule la vitesse après rebond
        const newV = bounceVelocity(impact)

        // Déplace légèrement la balle pour éviter de "rebondir au même point"
        const epsilon = 1e-6
        currentBall = {
            x: impact.impactX + newV.vx * epsilon,
            y: impact.impactY + newV.vy * epsilon,
            vx: newV.vx,
            vy: newV.vy,
        }
    }

    return impacts
}

