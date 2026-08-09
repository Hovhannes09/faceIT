function calculateElo(playerElo, opponentAvgElo, didWin, kFactor = 32) {
	const expectedScore = 1 / (1 + Math.pow(10, (opponentAvgElo - playerElo) / 400))
	const actualScore = didWin ? 1 : 0
	const newElo = Math.round(playerElo + kFactor * (actualScore - expectedScore))
	return newElo
}

export { calculateElo }