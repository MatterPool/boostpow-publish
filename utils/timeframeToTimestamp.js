function timeframeToTimestamp (timeframe) {
	if (timeframe === 'hour') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600;
	}
	if (timeframe === 'day') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24;
	}
	if (timeframe === 'fortnight') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24 * 14;
	}
	if (timeframe === 'year') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24 * 365;
	}
	if (timeframe === 'decade') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24 * 365 * 10;
	}
	return undefined;
}

export default timeframeToTimestamp;
