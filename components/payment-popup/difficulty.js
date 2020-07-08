// Defines the custom CSS for the difficulty slider component
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';

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
		marginLeft: -6,
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
	}
})(Slider);

// Return the difficulty value safely between min and max difficulty
export const safeDiffValue = (diffValue, minDiff, maxDiff) => {
	if (diffValue < minDiff) return minDiff;
	if (diffValue > maxDiff) return maxDiff;
	return diffValue;
};

// Returns an array of slider markers between min and max difficulty into a defined steps distance
export const calculateSliderMarks = (minDiff, maxDiff, sliderDiffMarkerStep) => {
	if (!sliderDiffMarkerStep) return [];
	const sm = [{ value: minDiff, label: minDiff }];
	for (var i = minDiff + 1; i < maxDiff; i++) {
		if (i % sliderDiffMarkerStep == 0) sm.push({ value: i, label: i });
	}
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
