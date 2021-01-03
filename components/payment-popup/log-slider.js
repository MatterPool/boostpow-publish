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
		MinSpaceSize: sliderCtrl.TopNextBoost > 0 ? (sliderCtrl.TopNextBoost - sliderCtrl.MinBoost) : 0
	});
}

export function RankSpaceSize(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		RankSpaceSize: sliderCtrl.Top1Boost > 0 ? (sliderCtrl.Top1Boost - sliderCtrl.TopNextBoost) : 0
	});
}

export function MaxBoost(sliderCtrl, Top1Boost, ExtendedSpaceRate) {
	return Object.assign({}, sliderCtrl, {
		MaxBoost:
			(Top1Boost || sliderCtrl.Top1Boost || 1) *
			(ExtendedSpaceRate || sliderCtrl.ExtendedSpaceRate || 1.25)
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
		diffPointsToTopN: sliderCtrl.TopNextBoost > 0 ? (sliderCtrl.TopNextBoost + 1 - sliderCtrl.content.CurrentBoost) : 0
	});
}

export function diffPointsToTop1(sliderCtrl) {
	return Object.assign({}, sliderCtrl, {
		diffPointsToTop1: sliderCtrl.Top1Boost > 0 ? (sliderCtrl.Top1Boost + 1 - sliderCtrl.content.CurrentBoost) : 0
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

export function sliderRankMarkers(sliderCtrl, rankMarkers) {
	if (!rankMarkers) rankMarkers = [1, 2, 3, 5, 10];
	// const markers = [{ value: sliderCtrl.MaxBoost, label: '' + sliderCtrl.MaxBoost }];
	const markers = [{ value: sliderCtrl.MaxBoost, label: '#LEAD' }];
	const addedBoostValues = []; // controls boostValue to allow only unique boost values (equal boosts display only the first rank marker)
	// from higuest to lowest rank
	for (let i = 0; i < sliderCtrl.ranksCtrl.ranks.length; i++) {
		let r = sliderCtrl.ranksCtrl.ranks[i];
		if (rankMarkers.indexOf(r.rank) > -1 && addedBoostValues.indexOf(r.boostValue) === -1) {
			markers.push({
				value: r.boostValue,
				label: '#' + r.rank
			});
			addedBoostValues.push(r.boostValue);
		}
	}
	if (addedBoostValues.indexOf(sliderCtrl.MinBoost) === -1)
		markers.push({ value: sliderCtrl.MinBoost, label: '#' + sliderCtrl.content.Rank.rank });
	return markers;
}

export function NewContentSliderCtrl(CBV, ranksCtrl, WidgetProps) {
	let sliderSpace = NewSliderCtrl({
		MinBoost: CBV,
		Top1Boost: ranksCtrl.top1.boostValue || CBV,
		TopNextBoost: ranksCtrl.topN.boostValue || CBV
	});
	sliderSpace.MinBoost = CBV;
	sliderSpace.ranksCtrl = ranksCtrl;
	sliderSpace = MinSpaceSize(sliderSpace);
	sliderSpace = RankSpaceSize(sliderSpace);
	sliderSpace = MaxBoost(
		sliderSpace, 
		ranksCtrl.empty ? sliderSpace.MinBoost+40 : null, 
		WidgetProps.slider.maxDiffInc
	);
	sliderSpace = ExtendedSpaceSize(sliderSpace);
	sliderSpace.content = {
		CurrentBoost: CBV,
		Rank: NewRank(ranksCtrl.topN.rank + 1, CBV)
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
	return val;
}

export function sliderScaleLabel(sliderCtrl, x) {
	return '+' + getAddedBoost(sliderCtrl, x);
}

/**
Let b be the amount of boost that some content already has. 

Let x ∈ [0, 1] be a variable representing the state of the slider bar. 0 means all the way to the left, whereas 1 means all the way to the right. 

Let f : [0, 1] → ℝ be a function that maps the state of the slider bar to boost values. f(0) is always 1. 

Let g : [0, 1] → ℝ be a function that maps the state of the slider bar to the amount of boost the content will have if the amount f(x). Thus, 
 */

// f(b, x) => f(x) = (b - 1) x + 1
export function sliderStateToBoostValue(boostTotalAmount, sliderState) {
	return (boostTotalAmount - 1) * sliderState + 1;
}
// fInverse(z, b) => f-1(z) = (z - 1) / (b - 1)
export function boostValueToSliderState(boostAmount, boostTotalAmount) {
	return (boostAmount - 1) / (boostTotalAmount - 1);
}

// g(x, b) => g(x) = f(x) + b + 1
export function totalBoostAfterSliderState(sliderState, boostTotalAmount) {
	return sliderStateToBoostValue(boostTotalAmount, sliderState) + boostTotalAmount + 1;
}

// gInverse(z, b) => g-1(z) = f-1(z - b - 1)
export function boostAmountToSliderState(boostAmount, boostTotalAmount) {
	return boostValueToSliderState(boostAmount - boostTotalAmount - 1, boostTotalAmount);
}

// fCompared(b, x, c) => f(x) = (2 c - b - 1) x + 1
export function sliderStateToBoostValueCompared(
	boostTotalAmount,
	sliderState,
	topContentBoostAmount
) {
	return sliderStateToBoostValue(2 * topContentBoostAmount - boostTotalAmount, sliderState);
}

// fComparedInverse(b, x, c) => f-1(z) = (z - 1) / (2 c - b - 1)
export function boostValueToSliderStateCompared(
	boostAmount,
	boostTotalAmount,
	topContentBoostAmount
) {
	return boostValueToSliderState(boostAmount, 2 * topContentBoostAmount - boostTotalAmount);
}
