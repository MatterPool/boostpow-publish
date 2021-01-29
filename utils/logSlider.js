export const BOOSTED_CONTENT = {
	CurrentBoost: 0, // the total boost a content currently have
	FutureBoost: 0, // the future total boost after adding new boost points
	Rank: null // { rank: 0, boostValue: 0 },
};

export const INITIAL_SLIDER_CTRL = {
	MinBoost: 0, // minimum boost space
	Top1Boost: 0, // The position of the Top1 marker
	TopNextBoost: 0, // The position of the TopN (last position) marker
	// MinSpaceSize: 0, // the total number of points between minimum and TopN
	// RankSpaceSize: 0, // the total number of points TopN and Top1 ranks
	ExtendedSpaceRate: 1.25,
	// MaxBoost: 0, // maximum boost space (normally Top1 * ExtendedSpaceRate but, can be different)
	// ExtendedSpaceSize: the total number of boost points between Top 1 and MaxBoost
	ranksCtrl: {}
};

export function NewRank(rank, boostVal) {
	return { rank: rank, boostValue: boostVal };
}

export function NewRanksCtrl(ranks) {
	const emptyRank = NewRank(1, 0);
	if (ranks.length == 0)
		return {
			top1: emptyRank,
			topN: emptyRank,
			ranks: [emptyRank],
			unique: true,
			empty: true
		};
	return {
		top1: ranks[0],
		topN: ranks[ranks.length - 1],
		ranks: ranks,
		unique: ranks.length === 1,
		empty: false
	};
}

//
export function GetTopNFromSignals(signals, cbv) {
	let allRanks = [];
	signals.forEach((sig, idx) => {
		if (sig.totalDifficulty_ > cbv) {
			allRanks.push(NewRank(idx + 1, sig.totalDifficulty_));
		}
	});
	return NewRanksCtrl(allRanks);
}

export function MinSpaceSize(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		MinSpaceSize: sliderCtrl.TopNextBoost > 0 ? sliderCtrl.TopNextBoost - sliderCtrl.MinBoost : 0
	});
}

export function RankSpaceSize(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		RankSpaceSize: sliderCtrl.Top1Boost > 0 ? sliderCtrl.Top1Boost - sliderCtrl.TopNextBoost : 0
	});
}

export function MaxBoost(sliderCtrl, maxDiffInc) {
	return Object.assign({}, sliderCtrl, {
		MaxBoost: sliderCtrl.ranksCtrl.empty
			? sliderCtrl.Top1Boost + 40
			: sliderCtrl.Top1Boost * maxDiffInc
	});
}

export function ExtendedSpaceSize(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		ExtendedSpaceSize: sliderCtrl.MaxBoost - sliderCtrl.Top1Boost
	});
}

export function NewSliderCtrl(sliderCtrl) {
	return Object.assign({}, INITIAL_SLIDER_CTRL, sliderCtrl);
}

export function diffPointsToTopN(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		diffPointsToTopN:
			sliderCtrl.TopNextBoost > 0
				? sliderCtrl.TopNextBoost + 1 - sliderCtrl.content.CurrentBoost
				: 0
	});
}

export function diffPointsToTop1(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		diffPointsToTop1:
			sliderCtrl.Top1Boost > 0 ? sliderCtrl.Top1Boost + 1 - sliderCtrl.content.CurrentBoost : 0
	});
}

export function diffPointsToRank(ranks, rank, CBV) {
	let rankObj = ranks.filter(rankObj => rankObj.rank === rank);
	if (rankObj.length === 0) return null;
	return rankObj[0].boostValue + 1 - CBV;
}

export function rankAfterAddedDiff(CBV, addedDiff, ranks) {
	const addedCBV = CBV + addedDiff;
	
	for (let i = ranks.length - 1; i >= 0; i--) {
		let r = ranks[i];
		if (r.boostValue > addedCBV) {
			return NewRank(r.rank + 1, addedCBV);
		}
	}
	return NewRank(1, addedCBV);
}

export function sliderRankMarkers(sliderCtrl, rankMarkers, inverseFunction) {
	const markers = [];
	const addedBoostValues = []; // controls boostValue to allow only unique boost values (equal boosts display only the first rank marker)
	// from higuest to lowest rank
	for (let i = 0; i < sliderCtrl.ranksCtrl.ranks.length; i++) {
		let r = sliderCtrl.ranksCtrl.ranks[i];
		if (r.boostValue > 0 && rankMarkers.indexOf(r.rank) > -1 && addedBoostValues.indexOf(r.boostValue) === -1) {
			markers.push({
				value: inverseFunction(r.boostValue),
				label: '#' + r.rank
			});
			addedBoostValues.push(r.boostValue);
		}
	}
	if (addedBoostValues.indexOf(sliderCtrl.content.CurrentBoost) === -1)
		markers.push({ value: 0, label: '#' + sliderCtrl.content.Rank.rank });
	return markers;
}

export function NewContentSliderCtrl(CBV, ranksCtrl, maxDiffInc) {
	let sliderSpace = NewSliderCtrl({
		MinBoost: CBV + 1,
		Top1Boost: ranksCtrl.top1.boostValue || CBV,
		TopNextBoost: ranksCtrl.topN.boostValue || CBV
	});
	sliderSpace.MinBoost = CBV + 1;
	sliderSpace.ranksCtrl = ranksCtrl;
	sliderSpace = MinSpaceSize(sliderSpace);
	sliderSpace = RankSpaceSize(sliderSpace);
	sliderSpace = MaxBoost(sliderSpace, maxDiffInc);
	sliderSpace = ExtendedSpaceSize(sliderSpace);
	sliderSpace.content = {
		CurrentBoost: CBV,
		Rank: NewRank(ranksCtrl.empty ? 1 : ranksCtrl.topN.rank + 1, CBV)
	};
	sliderSpace = diffPointsToTopN(sliderSpace);
	sliderSpace = diffPointsToTop1(sliderSpace);
	return sliderSpace;
}

export function getMinBoost(sliderCtrl) {
	return sliderCtrl && sliderCtrl.MinBoost > 0 ? sliderCtrl.MinBoost : 0;
}

export function getAddedBoost(sliderCtrl, x) {
	let min = getMinBoost(sliderCtrl);
	if (min === 0) min = 1;
	let val = x - (min - 1);
	return Math.floor(val);
}

export function sliderScaleLabel(sliderCtrl, x) {
	return '+' + getAddedBoost(sliderCtrl, x);
}
