// Defines the custom CSS for the difficulty slider component
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import ValueLabel from '@material-ui/core/Slider/ValueLabel';

// Custom styles configuration for the Difficulty Slider component
export const DiffSlider = withStyles({
	root: {
		color: '#34c74f',
		height: 8
	},
	thumb: {
		height: 20,
		width: 20,
		backgroundColor: '#ddd',
		border: '0px solid currentColor',
		marginTop: -7,
		marginLeft: -10,
		'&:focus, &:hover, &$active': {
			boxShadow: 'inherit'
		}
	},
	active: {},
	valueLabel: {
		left: 'calc(-50% + 4px)'
	},
	track: {
		height: 6,
		borderRadius: 4
	},
	markLabel: {
		fontSize: '0.7em'
	}
})(Slider);

// Custom styles for the Difficulty ValueLabel component
export const DiffValueLabel = withStyles({
	offset: {
		top: -22,
		left: -2
	},
	circle: {
		height: 24,
		width: 24
	}
	// label: {}
})(ValueLabel);

// Return the difficulty value safely between min and max difficulty
export const safeDiffValue = (diffValue, minDiff, maxDiff) => {
	if (diffValue < minDiff) return minDiff;
	if (diffValue > maxDiff) return maxDiff;
	return diffValue;
};

// Returns an array of slider markers between min and max difficulty into a defined steps distance
export const calculateSliderMarks = (minDiff, maxDiff, sliderDiffMarkerStep, marginRate) => {
	// margin rate defines the minimum distance, in percentage of the total slider bar length, of the markers that will appear after the first and before the last one on the bar
	marginRate = marginRate > 0 && marginRate > 1 ? marginRate : 0.035;
	if (!sliderDiffMarkerStep) return [];
	const sliderLength = maxDiff - minDiff;
	const sm = [{ value: minDiff, label: minDiff }];
	for (var i = minDiff + 1; i < maxDiff; i++) {
		if (i % sliderDiffMarkerStep == 0) {
			const minRate = (i - minDiff) / sliderLength;
			// If the first value does not respect minimum margin, does not add it
			if (sm.length == 1 && minRate < marginRate) continue;
			sm.push({ value: i, label: i });
		}
	}
	const last = sm[sm.length - 1];
	const maxRate = 1 - (last.value - minDiff) / sliderLength;
	// If the last value does not respect the last margin, removes it
	if (maxRate < marginRate) sm.pop();
	sm.push({ value: maxDiff, label: maxDiff });
	return sm;
};

// Render a single select box difficulty option
const renderDiffOption = (value, label) => {
	return (
		<option key={value} value={value}>
			{label || value}
		</option>
	);
};

// Renders all difficulty options available for the selection box
export const renderDiffOptions = (minDiff, maxDiff, sliderDiffStep) => {
	// always push the boost minDiff option
	let rows = [renderDiffOption(minDiff)];
	for (let i = minDiff; i < maxDiff; i++) {
		if (i > minDiff) {
			if (i % sliderDiffStep == 0) rows.push(renderDiffOption(i));
		}
	}
	// always push the boost maxDiff option
	rows.push(renderDiffOption(maxDiff));
	return rows;
};

// Verifies if there are rank signals loaded
export const hasRankSignals = rankProps => {
	return Array.isArray(rankProps.signals) && rankProps.signals.length > 0;
};

// Get the rank of a given difficulty compared to the actual loaded boost ranks
export const getDiffRank = (signals, difficulty) => {
	for (let i = signals.length; i > 0; i--) {
		const sig = signals[i - 1];
		if (sig.totalDifficulty > difficulty) return i + 1;
	}
	return 1;
};
