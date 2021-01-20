import * as boostpow from 'boostpow-js';
import * as LogSlider from '../components/payment-popup/log-slider';

const DEFAULT_RANK_MARKERS = [1, 2, 3, 4, 5, 10, 25, 50, 100];

// Return the current time, subtracted a number of hours, in seconds
const minedTimeFromHours = hours => {
	return parseInt(new Date().getTime() / 1000, 10) - 3600 * hours;
};

const searchMinedHoursOptions = (hours, options) => {
	if (hours > 0) {
		const minedTimeFrom = minedTimeFromHours(hours);
		return Object.assign({}, options, { minedTimeFrom: minedTimeFrom });
	}
	return options;
};

const searchTagOptions = (tag, options) => {
	if (typeof tag === 'string' && tag.length > 0) {
		return Object.assign({}, options, { tagutf8: tag });
	}
	return options;
};

const searchCategoryOptions = (category, options) => {
	if (typeof category === 'string' && category.length > 0) {
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
	
	if (boostSearch.list.length == 0) {
		res.diff = {
			...props.diff,
			...{ min: 1, max: 40, initial: 40 }
		};
		return res;
	}
	//
	let counts = analizeBoosts(boostSearch, props.slider.maxDiffInc);
	
	res.diff = {
		...props.diff,
		...{ min: counts.min+1, max: counts.incMax, initial: counts.max }
	};

	// Doing markers that shows the TOP ranks position, instead of boost values
	res.slider = { ...props.slider, ...{ sliderRankMarkers: [] } };
	if (props.slider.rankMarkers === true || Array.isArray(props.slider.rankMarkers)) {
		let rm =
			Array.isArray(props.slider.rankMarkers) && props.slider.rankMarkers.length > 0
				? props.slider.rankMarkers
				: DEFAULT_RANK_MARKERS;
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

const sliderMarkerStepsInit = (newProps, props)=>{
	// Overrides min, max and initial when they are explicitly defined by the user
	newProps.diff.min = 1;
	// if (props.diff.min > 0) newProps.diff.min = 1; // props.diff.min;
	if (props.diff.max > 0) newProps.diff.max = props.diff.max;
	if (props.diff.initial > 0) newProps.diff.initial = props.diff.initial;

	// Ensures safe initial value
	if (newProps.diff.initial > newProps.diff.max) newProps.diff.initial = newProps.diff.max;
	return newProps;
};

export const updateBoostsRank = async props => {
	if (!props.boostRank) {
		return props;
	}
	// Fetches the API and rank calcs
	let newProps = await prepareBoostProps(props);
	
	let contentBoosts = {};
	
	if (props.content.hash.length == 64) {
		contentBoosts = await searchContentHex(props.content.hash, props);
		const CBV = contentBoosts.totalDifficulty_;
		props.contentBoosts = contentBoosts;

		const ranksCtrl = LogSlider.GetTopNFromSignals(newProps.signals, CBV);
		const newSliderCtrl = LogSlider.NewContentSliderCtrl(CBV, ranksCtrl, newProps);
		// Overrides min, max and initial when they are explicitly defined by the user
		newProps.diff.min = 1;
		if (newSliderCtrl.MinBoost > 0) newProps.diff.min = newSliderCtrl.MinBoost;
		if (newSliderCtrl.MaxBoost > 0) newProps.diff.max = newSliderCtrl.MaxBoost;
		if (newSliderCtrl.Top1Boost > 0) newProps.diff.initial = newSliderCtrl.Top1Boost+1;
		if (newSliderCtrl.MinBoost > newSliderCtrl.Top1Boost) {
			newProps.diff.initial = newSliderCtrl.MinBoost;
		}

		// Ensures safe initial value
		if (newProps.diff.initial > newProps.diff.max) newProps.diff.initial = newProps.diff.max;
		
		if (newProps.slider.rankMarkers === true || Array.isArray(newProps.slider.rankMarkers)) {
			let rm = [1, 2, 3, 5, 10];
			if (Array.isArray(newProps.slider.rankMarkers) && newProps.slider.rankMarkers.length > 0) {
				rm = newProps.slider.rankMarkers;
			}
			newProps.slider.sliderRankMarkers = LogSlider.sliderRankMarkers(newSliderCtrl, rm);
		} else {
			newProps = sliderMarkerStepsInit(newProps, props);
		}
		newProps.sliderCtrl = newSliderCtrl;
		
	} else {
		newProps = sliderMarkerStepsInit(newProps, props);
	}
	return newProps;
};
