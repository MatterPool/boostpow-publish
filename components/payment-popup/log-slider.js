export const BOOSTED_CONTENT = {
	CurrentBoost: 0, // the total boost a content currently have
	FutureBoost: 0, // the future total boost after adding new boost points
	Rank: null, // { rank: 0, boostValue: 0 },
};

export const INITIAL_SLIDER_OBJ = {
	MinBoost: 0, // minimum boost space
	Top1Boost: 0, // The position of the Top1 marker
	TopNextBoost: 0, // The position of the TopN (last position) marker
	// MinSpaceSize: 0, // the total number of points between minimum and TopN
	// RankSpaceSize: 0, // the total number of points TopN and Top1 ranks
	ExtendedSpaceRate: 1.2,
	// MaxBoost: 0, // maximum boost space (normally Top1 * ExtendedSpaceRate but, can be different)
	// ExtendedSpaceSize: the total number of boost points between Top 1 and MaxBoost
	ranks: []
};

export function NewRankObj(rank, boostVal) {
	return { rank: rank, boostValue: boostVal };
}

export function NewRanksObj(ranks) {
	if (ranks.length == 0) return null;
	return {
		top1: ranks[0],
		topN: ranks[ranks.length - 1],
		ranks: ranks,
		unique: ranks.length === 1
	};
}

//
export function GetTopNFromSignals(signals, cbv) {
	let allRanks = [];
	signals.forEach((sig, idx) => {
		if (sig.totalDifficulty_ > cbv) {
			allRanks.push(NewRankObj(idx + 1, sig.totalDifficulty_));
		}
	});
	return NewRanksObj(allRanks);
}

export function MinSpaceSize(sliderObj) {
	return Object.assign({}, sliderObj, {
		MinSpaceSize: sliderObj.TopNextBoost - sliderObj.MinBoost
	});
}

export function RankSpaceSize(sliderObj) {
	return Object.assign({}, sliderObj, {
		RankSpaceSize: sliderObj.Top1Boost - sliderObj.TopNextBoost
	});
}

export function MaxBoost(sliderObj) {
	return Object.assign({}, sliderObj, {
		MaxBoost: sliderObj.Top1Boost * sliderObj.ExtendedSpaceRate
	});
}

export function ExtendedSpaceSize(sliderObj) {
	return Object.assign({}, sliderObj, {
		ExtendedSpaceSize: sliderObj.MaxBoost - sliderObj.Top1Boost
	});
}

export function NewSliderSpace(sliderObj) {
	return Object.assign({}, INITIAL_SLIDER_OBJ, sliderObj);
}

export function NewContentSliderSpace(CBV, ranksObj) {
	console.log('NewContentSliderSpace', CBV, ranksObj);
	let sliderSpace = NewSliderSpace({
		MinBoost: CBV,
		Top1Boost: ranksObj.top1.boostValue,
		TopNextBoost: ranksObj.topN.boostValue,
	});
	sliderSpace.MinBoost = CBV;
	sliderSpace.ranks = ranksObj;
	sliderSpace = MinSpaceSize(sliderSpace);
	sliderSpace = RankSpaceSize(sliderSpace);
	sliderSpace = MaxBoost(sliderSpace);
	sliderSpace = ExtendedSpaceSize(sliderSpace);
	sliderSpace.content = {
		Rank: NewRankObj(ranksObj.topN.rank + 1, CBV),
	};
	sliderSpace.diffPointsToTopN = function() {
		return this.TopNextBoost + 1 - CBV;
	};
	sliderSpace.diffPointsToTop1 = function() {
		return this.Top1Boost + 1 - CBV;
	};
	sliderSpace.diffPointsToRank = function(rank) {
		let rankObj = this.ranks.ranks.filter(rankObj => rankObj.rank === rank);
		if (rankObj.length === 0) return null;
		return rankObj[0].boostValue + 1 - CBV;
	};
	sliderSpace.rankAfterAddedDiff = function(addedDiff) {
		const addedCBV = CBV + addedDiff;
		for (let i = this.ranks.ranks.length - 1; i >= 0; i--) {
			let r = this.ranks.ranks[i];
			if (r.boostValue > addedCBV){
				return NewRankObj(r.rank + 1, addedCBV);
			}
		}
		return NewRankObj(1, addedCBV);
	};
	sliderSpace.sliderRankMarkers = function(ranks) {
		if (!ranks) ranks = [1, 2, 3, 5, 10];
		const markers = [{ value: this.MaxBoost, label: '' + this.MaxBoost }];
		for (let i = 0; i < this.ranks.ranks.length; i++) {
			let r = this.ranks.ranks[i];
			if (ranks.indexOf(r.rank) > -1) {
				markers.push({ value: this.diffPointsToRank(r.rank), label: '#' + r.rank });
			}
		}
		markers.push({ value: this.MinBoost, label: '#'+this.content.Rank.rank });
		return markers;
	};
	
	return sliderSpace;
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
