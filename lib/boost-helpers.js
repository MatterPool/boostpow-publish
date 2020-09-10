import * as boostpow from 'boostpow-js';

const DEFAULT_RANK_MARKERS = [1, 5, 10, 25, 50, 100];

// Return the current time, subtracted a number of hours, in seconds
const minedTimeFromHours = (hours) => {
	return parseInt(new Date().getTime() / 1000, 10) - 3600 * hours;
};

const searchMinedHoursOptions = (hours, options) => {
	if (hours > 0){
		const minedTimeFrom = minedTimeFromHours(hours);
		return Object.assign({}, options, { minedTimeFrom: minedTimeFrom });
	}
	return options;
};

const searchTagOptions = (tag, options) => {
	if (typeof tag === 'string' && tag.length > 0){
		return Object.assign({}, options, { tagutf8: tag });
	}
	return options;
};

const searchCategoryOptions = (category, options) => {
	if (typeof category === 'string' && category.length > 0){
		return Object.assign({}, options, { categoryutf8: category });
	}
	return options;
};

const searchContentHexOptions = (contenthex, options) => {
	if (typeof contenthex === 'string' && contenthex.length > 0) {
		return Object.assign({}, options, { contenthex: contenthex });
	}
	return options;
};

export const graphOptions = props => {
	let boostGraphOptions = {};
	boostGraphOptions = searchMinedHoursOptions(props.boostRank.hours || 24, boostGraphOptions);
	boostGraphOptions = searchTagOptions(props.boostRank.tag || '', boostGraphOptions);
	boostGraphOptions = searchCategoryOptions(props.boostRank.category || '', boostGraphOptions);
	return boostGraphOptions;
};

export const graphSearch = async options => {
	return await boostpow.Graph({}).search(options);
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
			markers.push({ value: bss.totalDifficulty, label: '#' + rank });
		}
	});
	return markers;
};

// Receives a boostpow properties object, fetches rank from api, and calculate min, max and initial diff values
export const fetchBoostsApi = async props => {
	let res = {};
	let boostGraphOptions = graphOptions(props);
	const boostSearch = await graphSearch(boostGraphOptions);
	res.signals = boostSearch.list || [];
	if (boostSearch.list.length == 0) return res;
	//
	let counts = analizeBoosts(boostSearch, props.diff.maxDiffInc || 1.25); // from 80% to 100%
	res.diff = {
		...props.diff,
		...{ min: counts.min, max: counts.incMax, initial: counts.max }
	};
	// Doing markers that shows the TOP ranks position, instead of boost values
	res.slider = { ...props.slider, ...{ sliderRankMarkers: [] } };
	if (props.slider.rankMarkers === true || Array.isArray(props.slider.rankMarkers)) {
		let rm = DEFAULT_RANK_MARKERS;
		if (Array.isArray(props.slider.rankMarkers) && props.slider.rankMarkers.length > 0) {
			rm = props.slider.rankMarkers;
		}
		res.slider.sliderRankMarkers = sliderRankMarkers(boostSearch.list, rm);
	}
	return res;
};

// Receives a boostpow properties object and applies ranking properties if needed
export const prepareBoostProps = async props => {
	return Object.assign({}, props, await fetchBoostsApi(props));
};

// Receives a boostpow properties object and applies ranking properties if needed
export const searchContentHex = async (contenthex, props) => {
	let opts = graphOptions(props || {});
	opts = searchContentHexOptions(contenthex, opts);
	return Object.assign({}, await graphSearch(opts));
};