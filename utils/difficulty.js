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
		<option key={'diffopt-' + value} value={value}>
			{label || value}
		</option>
	);
};

// Renders all difficulty options available for the selection box
export const renderDiffOptions = (minDiff, maxDiff, sliderDiffStep, labelPrefix) => {
	const lbl = labelPrefix || '';
	// always push the boost minDiff option
	let rows = [renderDiffOption(minDiff, lbl + '1')];
	let i = 1 + sliderDiffStep;
	let d = minDiff + sliderDiffStep;
	while (d < maxDiff) {
		rows.push(renderDiffOption(d, lbl + i.toString()));
		i += sliderDiffStep;
		d += sliderDiffStep;
	}

	// always push the boost maxDiff option
	rows.push(renderDiffOption(maxDiff, lbl + (maxDiff - minDiff + 1)));
	return rows;
};

// Verifies if there are rank signals loaded
export const hasRankSignals = rankProps => {
	return Array.isArray(rankProps.signals) && rankProps.signals.length > 0;
};

// Get the rank of a given difficulty compared to the actual loaded boost ranks
export const getDiffRank = (signals, difficulty) => {
	const sigs = signals;
	for (let i = sigs.length; i > 0; i--) {
		const sig = sigs[i - 1];
		const tot = sig.totalDifficulty || sig.totalDifficulty_;
		if (tot > difficulty) return i + 1;
	}
	return 1;
};
