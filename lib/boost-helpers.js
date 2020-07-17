import * as boostpow from 'boostpow-js';

// Return the current time, subtracted a number of hours, in seconds
export const minedTimeFromHours = (hours, options) => {
	const minedTimeFrom = parseInt(new Date().getTime() / 1000, 10) - 3600 * hours;
	if (options) return Object.assign({}, options, { minedTimeFrom: minedTimeFrom });
	return minedTimeFrom;
};

export const graphSearch = async options => {
	return await boostpow.Graph({}).search(options);
};

export const searchMinedHours = async (hours, options) => {
	options = minedTimeFromHours(hours, options || {});
	return await graphSearch(options);
};

// Analyze a boost graph search object and returns its min, max, incMax and other numbers
export const analizeDifficulty = (boostSearch, incrementRate) => {
	const blist = boostSearch.list;
	// const total = boostSearch.totalDifficulty;
	// blist.forEach((bss, idx) => {
	//     const rate = bss.totalDifficulty / total;
	// 	console.log(bss, idx, bss.totalDifficulty, rate);
	// });
	return {
		min: Math.floor(parseFloat(blist[blist.length - 1].totalDifficulty)),
		max: Math.round(parseFloat(blist[0].totalDifficulty)),
		incMax: Math.round(blist[0].totalDifficulty * (incrementRate > 0 ? incrementRate : 1))
		// avg: total / blist.length,
	};
};

// Receives a boostpow properties object and applies ranking properties if needed
export const prepareBoostProps = async props => {
	const boostSearch = await searchMinedHours(props.rankHours || 24);
	// console.log('boostSearch', boostSearch);
	if (boostSearch.list.length == 0) return props;
	//
	const counts = analizeDifficulty(boostSearch, props.maxIncrement || 1.25); // from 80% to 100%
	// console.log('boostsMinMaxInc', counts);
	props.minDiff = counts.min;
	props.maxDiff = counts.incMax;
	props.initialDiff = counts.max;
	return props;
};
