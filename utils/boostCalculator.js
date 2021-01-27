import * as LogSlider from 'app-utils/logSlider';
import * as Difficulty from 'app-utils/difficulty';

function BoostCalculator(signals, contentBoosts, maxDiffInc) {
	const signalsList = signals && signals.list ? signals.list : [];
	const currentBoostValue = contentBoosts.totalDifficulty_ || 0;

	const ranksCtrl = LogSlider.GetTopNFromSignals(signalsList, currentBoostValue);
	const sliderCtrl = LogSlider.NewContentSliderCtrl(currentBoostValue, ranksCtrl, maxDiffInc);

	const currentRank = Difficulty.getDiffRank(signalsList, currentBoostValue);

	const range = {};
	range.min = sliderCtrl.MinBoost || 1;
	range.max = sliderCtrl.MaxBoost;
	range.initial = Math.min(Math.max(sliderCtrl.Top1Boost + 1, range.min), range.max);

	function sliderProps(userConfig, sliderValue) {
		// calculates sliderProps for rendering
		// user config is the payProps.slider

		if (sliderValue < range.min || sliderValue > range.max) {
			sliderValue = range.initial;
		}

		let rankMarkers;
		if (userConfig.rankMarkers === true) {
			rankMarkers = [1, 5, 10, 25, 50, 100];
		} else if (Array.isArray(userConfig.rankMarkers) && userConfig.rankMarkers.length > 0) {
			rankMarkers = userConfig.rankMarkers;
		}

		const markers = LogSlider.sliderRankMarkers(sliderCtrl, rankMarkers);
		const diffStep = userConfig.sliderStep > 0 ? parseInt(userConfig.sliderStep, 10) : 1;

		return {
			min: range.min,
			max: range.max,
			value: sliderValue,
			diffStep,
			markers
		};
	}

	function addedBoost(sliderValue) {
		return sliderValue - (range.min - 1);
	}

	function newTotalBoost(sliderValue) {
		return currentBoostValue + addedBoost(sliderValue);
	}

	function newRank(sliderValue) {
		return LogSlider.rankAfterAddedDiff(currentBoostValue, addedBoost(sliderValue), ranksCtrl.ranks)
			.rank;
	}

	return {
		currentBoostValue,
		currentRank,
		signals: signalsList,
		contentBoosts,
		sliderCtrl,
		ranksCtrl,
		range,
		sliderProps,
		addedBoost,
		newTotalBoost,
		newRank
	};
}

export default BoostCalculator;
