


export const color = {
player: ["#FF0000","#00FF00","#0000FF","#FF00FF","#00FFFF","#FFFF00","#FF5500","#0055FF","#FF0000","#00FF00","#0000FF","#FF00FF"],
playerComp :  ["#550000","#005500","#000055","#550055","#005555","#555500","#552200","#002255", "#550000","#005500","#000055","#550055"],
colorBall : "#DEDEDE",
colorBallComp : "#545454"
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

function toggleColor()
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

