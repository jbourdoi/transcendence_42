


export const color = {
player: ["#F00","#0F0","#00F","#F0F","#0FF","#FF0"],
playerComp :  ["#500","#050","#005","#505","#055","#550"],
colorBall : "#DDD",
colorBallComp : "#555"
}

function colorContrasted(hex: any)
{
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	const rComp = 255 - r
	const gComp = 255 - g
	const bComp = 255 - b
	const compColor = `rgb(${rComp},${gComp},${bComp})`
	return compColor
}

function randomColor()
{
	const random = Math.floor(Math.random() * 0xffffff);
	const hex = random.toString(16).padStart(6, "0");
	return `#${hex}`;
}

export function toggleColor()
{
	return
	for (let i=0; i<color.player.length; i++)
	{
		color.player[i] = randomColor()
		color.playerComp[i] = colorContrasted(color.player[i])
	}
	color.colorBall = randomColor()
	color.colorBallComp = colorContrasted(color.colorBall)
}

