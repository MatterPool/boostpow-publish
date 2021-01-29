import * as LogSlider from 'app-utils/logSlider';
import * as Difficulty from 'app-utils/difficulty';

function BoostCalculator(signals, contentBoosts, maxDiffInc) {
	console.log('generating boost calculator; signals = ', signals);

	const signalsList = signals && signals.list ? signals.list : [];
	const currentBoostValue = contentBoosts.totalDifficulty_ || 0;

	console.log('generating boost calculator; current boost value = ', currentBoostValue);
	console.log('generating boost calculator: signals list: ', signalsList);

	const ranksCtrl = LogSlider.GetTopNFromSignals(signalsList, currentBoostValue);
	const sliderCtrl = LogSlider.NewContentSliderCtrl(currentBoostValue, ranksCtrl, maxDiffInc);

	const currentRank = Difficulty.getDiffRank(signalsList, currentBoostValue);

	const range = {};
	range.min = 0;
	range.max = 1;
	range.initial = 0;

	// these functions determine the relationship between values on the
	// slider bar and boosted values.
	let sliderToAddedBoost;
	let boostToSlider;

	if (ranksCtrl.ranks.length === 1) {
		if (currentBoostValue === 0) {
			// we arbitrarily allow a top value of 40 in this case.
			sliderToAddedBoost = function(x) {
				return 1 + 39 * x;
			};
			boostToSlider = function(z) {
				return (z - currentBoostValue - 1) / 39;
			};
		} else {
			// we allow the user to boost up to twice the current value.
			sliderToAddedBoost = function(x) {
				return 1 + (currentBoostValue - 1) * x;
			};
			boostToSlider = function(z) {
				return (z - currentBoostValue - 1) / (currentBoostValue - 1);
			};
		}
	} else if (ranksCtrl.ranks.length === 2) {
		const top = ranksCtrl.ranks[0].boostValue;

		// we allow the user to boost up to twice the top boosted value
		sliderToAddedBoost = function(x) {
			return (2 * top - currentBoostValue - 1) * x + 1;
		};
		boostToSlider = function(z) {
			return (z - currentBoostValue - 1) / (2 * top - currentBoostValue - 1);
		};
	} else {
		const max = 2 * ranksCtrl.ranks[0].boostValue;

		const normalization = currentBoostValue + 1;
		/*
		let xy = 0;
		let xx = 0;

		ranksCtrl.ranks.forEach((elem, n) => {
			let x = (ranksCtrl.ranks.length - n) / (ranksCtrl.ranks.length + 1);
			let y = Math.log(elem.boostValue / normalization);
			xy += x * y
			xx += x * x;
		});*/

		const slope = Math.log(max / normalization);

		sliderToAddedBoost = function(x) {
			return normalization * Math.exp(slope * x) - currentBoostValue;
		};

		boostToSlider = function(z) {
			return Math.log(z / normalization) / slope;
		};
	}

	function sliderProps(userConfig, sliderValue) {
		// calculates sliderProps for rendering
		// user config is the payProps.slider

		if (sliderValue < range.min || sliderValue > range.max) {
			sliderValue = range.initial;
		}

		let rankMarkers;
		if (userConfig.rankMarkers === true) {
			rankMarkers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 100];
		} else if (Array.isArray(userConfig.rankMarkers) && userConfig.rankMarkers.length > 0) {
			rankMarkers = userConfig.rankMarkers;
		}

		const markers = LogSlider.sliderRankMarkers(sliderCtrl, rankMarkers, boostToSlider);

		return {
			min: range.min,
			max: range.max,
			value: sliderValue,
			markers
		};
	}

	function newTotalBoost(addedBoost) {
		return currentBoostValue + addedBoost;
	}

	function newRank(addedBoost) {
		return LogSlider.rankAfterAddedDiff(currentBoostValue, addedBoost, ranksCtrl.ranks).rank;
	}

	return {
		currentBoostValue,
		currentRank,
		signals: signalsList,
		contentBoosts,
		sliderCtrl,
		ranksCtrl,
		range,
		sliderToAddedBoost,
		boostToSlider,
		sliderProps,
		newTotalBoost,
		newRank
	};
}

export default BoostCalculator;
