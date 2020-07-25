import * as boostpow from 'boostpow-js';

const DEFAULT_RANK_MARKERS = [1, 5, 10, 25, 50, 100];

// Return the current time, subtracted a number of hours, in seconds
const minedTimeFromHours = (hours, options) => {
	const minedTimeFrom = parseInt(new Date().getTime() / 1000, 10) - 3600 * hours;
	if (options) return Object.assign({}, options, { minedTimeFrom: minedTimeFrom });
	return minedTimeFrom;
};

const graphSearch = async options => {
	return await boostpow.Graph({}).search(options);
};

const searchMinedHours = async (hours, options) => {
	options = minedTimeFromHours(hours, options || {});
	return await graphSearch(options);
};

// Analyze a boost graph search object and returns its min, max, incMax and other numbers
const analizeBoosts = (boostSearch, incrementRate) => {
	const blist = boostSearch.list;
	return {
		min: Math.floor(parseFloat(blist[blist.length - 1].totalDifficulty)),
		max: Math.round(parseFloat(blist[0].totalDifficulty)),
		incMax: Math.round(blist[0].totalDifficulty * (incrementRate > 0 ? incrementRate : 1))
		// avg: total / blist.length,
	};
};

// Analyze a boost summary list and returns the scores for each rank on the ranks array
const sliderRankMarkers = (blist, ranks) => {
	const markers = [];
	if (!ranks) ranks = DEFAULT_RANK_MARKERS;
	blist.forEach((bss, idx) => {
		const rank = idx + 1;
		if (ranks.indexOf(rank) > -1) {
			markers.push({ value: bss.totalDifficulty, label: 'TOP ' + rank });
		}
	});
	return markers;
};

// Receives a boostpow properties object, fetches rank from api, and calculate min, max and initial diff values
const fetchBoostsApi = async props => {
	const res = {};
	const boostSearch = await searchMinedHours(props.rankHours || 24);
	// console.log('boostSearch', boostSearch);
	res.signals = boostSearch.list || [];
	if (boostSearch.list.length == 0) return res;
	//
	const counts = analizeBoosts(boostSearch, props.maxIncrement || 1.25); // from 80% to 100%
	// console.log('boostsMinMaxInc', counts);
	res.minDiff = counts.min;
	res.maxDiff = counts.incMax;
	res.initialDiff = counts.max;

	// Doing markers that shows the TOP ranks position, instead of boost values
	res.sliderRankMarkers = [];
	if (props.rankMarkers === true || Array.isArray(props.rankMarkers)){
		let rm = DEFAULT_RANK_MARKERS;
		if (Array.isArray(props.rankMarkers) && props.rankMarkers.length > 0) {
			rm = props.rankMarkers;
		}
		res.sliderRankMarkers = sliderRankMarkers(boostSearch.list, rm);
	}
	return res;
};

// Receives a boostpow properties object and applies ranking properties if needed
export const prepareBoostProps = async props => {
	return Object.assign({}, props, await fetchBoostsApi(props));
};
