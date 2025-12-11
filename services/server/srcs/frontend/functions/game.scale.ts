export const board = {
	width : 600,
	height : 600,
	ballSize : 10,
	paddleWidth : 30
}

export const arena = {
	centerX: board.width / 2,
	centerY: board.height / 2,
	radius: Math.min(board.width, board.height) / 2 - board.paddleWidth,
}
