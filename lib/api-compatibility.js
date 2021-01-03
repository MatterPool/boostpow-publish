const Helpers = require('./helpers');
const WalletsLib = require('./wallets');

/* PREVIOUS API
    {
		# wallets: VALID_WALLETS,
		# getBoostRank: true,
		# rankHours: 24,
		# outputs: [
			{
				to: "18YCy8VDYcXGnekHC4g3vphnJveTskhCLf", amount: 0.0004, currency: 'BSV'
			}
		],
    	# showContentPreview: true,
		# content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09',
		# tag: 'bitcoin',
		# category: 'B' // defaults to 'B' underneath.
		# content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09',
		# initialWallet: 'moneybutton', // 'moneybutton' or 'relayx'
		# tag: '$',
		# showTagField: false, // defaults to true
		# showCategoryField: false, // defaults to false
		# minDiff: 1, // defaults to 1; ignored if getBoostRank is true
		# maxDiff: 40, // defaults to 40; ignored if getBoostRank is true
		# initialDiff: 1, // defaults to the minimal difficulty or 1; ignored if getBoostRank is true
		# diffMultiplier: 0.00002, // defaults to 0.00002
		# lockDiff: false, // defaults to false
		# showInputDiff: false, // defaults to false
		# showSliderDiff: true, // defaults to true
		# sliderDiffStep: 1, // defaults to 1
		# sliderDiffMarkerStep: 10, // defaults to 10, use 0 to disable markers
		# sliderMarkersMaxCount: 15, // defaults to 15
		# displayMessage: 'hello world',
	}
*/

/* NEW API CONFIGURATION OBJECT
    {
        message: { // displayMessage
			text: '', // displayMessage
			markdown: '', // new
			html: '' // new
		},
		showContent: true,
		content: {
			hash: '', // content => If is a hash, show content, else hides the content
			show: true // showContentPreview
		},
		showTag: true,
		tag: { // tag => if is a string or empty string show tag field with tag filled
			value: '',
			show: true, // showTagField 
			disabled: false
		}, 
		showCategory: true,
		category: { // category => if is a string or empty string show category field with category filled
			value: '',
			show: true, // showCategoryField 
			disabled: false
		},
		boostRank: { // getBoostRank
			hours: 24, // rankHours
			tag: '', // filters the api with tag
			category: '' // filter the api with category
		},
		diff: {
			min: undefined, // minDiff
			max: undefined, // maxDiff
			initial: undefined, // initialDiff
			multiplier: 0.00002, // diffMultiplier
			disabled: false, // lockDiff
			showInput: false, // showInputDiff
		},
		slider: { // showSliderDiff
			sliderStep: 1, // sliderDiffStep
			markerStep: 10, // sliderDiffMarkerStep
			maxMarkers: 15, // sliderMarkersMaxCount
			rankMarkers: [],
			logScale: false,
			maxDiffInc: 2
		},
		wallets: {
			available: ['moneybutton', 'relayx'], // wallets
			initial: 'moneybutton' // initialWallet
		},
		outputs: [],
    }
*/

/*
	API legacy compatibility analysis follows these rules:
	1) Newer API properties overrides older properties.
	2) If newer properties does not exists, searches for older properties.
	3) If older properties does not exists, return defaults.
*/

export function normalizeLegacyApi(opts) {
	opts = opts || {};
	let newOpts = {};
	//
	newOpts.message = normalizeMessage(opts);
	newOpts.content = normalizeContent(opts);
	newOpts.tag = normalizeTag(opts);
	newOpts.category = normalizeCategory(opts);
	newOpts.boostRank = normalizeBoostRank(opts, newOpts);
	newOpts.diff = normalizeDifficulty(opts);
	newOpts.slider = normalizeSlider(opts);
	newOpts.wallets = normalizeWallets(opts);
	newOpts.outputs = normalizeOutputs(opts);
	//
	return newOpts;
}

function normalizeMessage(opts) {
	let o = undefined;
	if (Helpers.hasStrLen(opts.message, 1)) return { text: opts.message };
	if (Helpers.hasObjProp(opts.message, 'text') && Helpers.hasStrLen(opts.message.text, 1))
		return { text: opts.message.text };
	// if (Helpers.hasObjProp(opts.message, 'markdown') && Helpers.hasStrLen(opts.message.markdown, 1)) return { markdown: opts.message.markdown };
	// if (Helpers.hasObjProp(opts.message, 'html') && Helpers.hasStrLen(opts.message.html, 1)) return { html: opts.message.html };

	// Verify old api
	if (Helpers.hasStrLen(opts.displayMessage, 1)) {
		// TODO: Detect markdown or html here
		o = {
			text: opts.displayMessage
			// markdown: undefined,
			// html: undefined
		};
	}
	return o;
}

function normalizeContent(opts) {
	let o = { hash: '', show: true };
	// if content is a hash string
	if (Helpers.hasStrLen(opts.content, 1)) {
		o = Object.assign({}, o, { hash: opts.content });
	}
	// if it is an object with a valid hash property
	else if (Helpers.hasObjProp(opts.content, 'hash') && Helpers.hasStrLen(opts.content.hash, 1)) {
		o = Object.assign({}, o, opts.content);
	}
	// if not a string, and not an object, return an error
	else return o;

	//
	if (Helpers.isStrictBool(opts.showContent)) {
		o.show = opts.showContent;
	} else if (Helpers.isStrictBool(opts.showContentPreview)) {
		o.show = opts.showContentPreview;
	}
	if (Helpers.isUndef(o.show)) {
		o.show = true;
	}
	return o;
}

function normalizeTag(opts) {
	const defaults = { value: '', show: true, disabled: false };
	let o = undefined;
	if (Helpers.isUndef(opts.tag)) return opts.showTag === true || opts.showTagField === true ? defaults : o;
	if (opts.tag === '') return defaults;
	if (Helpers.hasStrLen(opts.tag, 1)) {
		// when simple string
		o = Object.assign({}, defaults, { value: opts.tag });
	} else if (
		Helpers.hasObjProp(opts.tag) && // when object
		(Helpers.hasStrLen(opts.tag.value, 0) || opts.tag.show === true) // with valid value or only show tag
	) {
		o = Object.assign({}, defaults, opts.tag);
	}
	// if not a string, and not an object, consider undefined
	else return o;

	if (Helpers.isStrictBool(opts.showTag)) {
		o.show = opts.showTag;
	} else if (Helpers.isStrictBool(opts.showTagField)) {
		o.show = opts.showTagField;
	}
	if (Helpers.isUndef(o.show)) {
		o.show = true;
	}
	return o;
}

function normalizeCategory(opts) {
	const defaults = { value: '', show: true, disabled: false };
	let o = undefined;
	if (Helpers.isUndef(opts.category)) return opts.showCategory === true || opts.showCategoryField === true ? defaults : o;
	if (opts.tag === '') return defaults;
	if (Helpers.hasStrLen(opts.category, 1)) {
		// when simple string
		o = Object.assign({}, defaults, { value: opts.category });
	} else if (
		Helpers.hasObjProp(opts.category) && // when object
		(Helpers.hasStrLen(opts.category.value, 0) || opts.category.show === true) // with valid value or only show category
	) {
		o = Object.assign({}, defaults, opts.category);
	}
	// if not a string, and not an object, consider undefined
	else return o;

	if (Helpers.isStrictBool(opts.showCategory)) {
		o.show = opts.showCategory;
	} else if (Helpers.isStrictBool(opts.showCategoryField)) {
		o.show = opts.showCategoryField;
	}
	if (Helpers.isUndef(o.show)) {
		o.show = true;
	}
	return o;
}

function normalizeBoostRank(opts, newOpts) {
	// default values
	const DEFAULT_HOURS = 24;
	let o = {
		hours: DEFAULT_HOURS,
		tag: newOpts.tag && newOpts.tag.value && newOpts.tag.value.length > 0 ? newOpts.tag.value : '',
		category: newOpts.category && newOpts.category.value && newOpts.category.value.length > 0 ? newOpts.category.value : ''
	};

	// boostRank property overrides old api properties

	// if strictly true, returns default values else only false
	if (Helpers.isStrictBool(opts.boostRank)) {
		return opts.boostRank ? o : false;
	}
	// When object, overrides defaults and return
	else if (Helpers.hasObjProp(opts.boostRank)) {
		o = Object.assign({}, o, opts.boostRank);
		if (isNaN(o.hours) || o.hours <= 0) o.hours = DEFAULT_HOURS;
		return o;
	}

	// Here boostRank is considered not defined, because it is not a boolean or an object
	// So, start searching verifying old api values
	if (opts.getBoostRank === false) return false;
	if (Helpers.isUndef(opts.getBoostRank)) return o;

	// Here opts.getBoostRank is considered true
	o.hours = opts.rankHours > 0 ? opts.rankHours : DEFAULT_HOURS;
	return o;
}

function difficultyConsistency(o) {
	// if (isNaN(o.min) || o.min <= 0) o.min = 1;
	// if (isNaN(o.max) || o.max <= o.min) o.max = o.min + 40;
	// if (isNaN(o.initial) || o.initial < o.min) o.initial = o.min;
	// if (o.initial > o.max) o.initial = o.max;
	if (isNaN(o.multiplier) || o.multiplier <= 0) o.multiplier = 0.00002;
	if (!Helpers.isStrictBool(o.disabled)) o.disabled = false;
	if (!Helpers.isStrictBool(o.showInput)) o.showInput = false;
	return o;
}

function normalizeDifficulty(opts) {
	// min, max and initial must be undefined, because they must be explicitly defined to override boostRank api values, when boostRank enabled
	let o = {
		min: undefined, // minDiff
		max: undefined, // maxDiff
		initial: undefined, // initialDiff
		multiplier: 0.00002, // diffMultiplier
		disabled: false, // lockDiff
		showInput: false // showInputDiff
	};

	// if strictly true, returns default values
	if (Helpers.isStrictBool(opts.diff)) {
		return o;
	}
	// When object, overrides defaults and return
	else if (Helpers.hasObjProp(opts.diff)) {
		o = Object.assign({}, o, opts.diff);
		return difficultyConsistency(o);
	}

	o.min = opts.minDiff > 0 ? opts.minDiff : o.min || undefined;
	o.max = opts.maxDiff > o.min ? opts.maxDiff : o.max || undefined;
	o.initial =
		opts.initialDiff >= o.min && opts.initialDiff <= o.max ? opts.initialDiff : o.initial || o.min;
	o.multiplier = opts.diffMultiplier > 0 ? opts.diffMultiplier : o.multiplier || 0.00002;
	o.disabled = Helpers.isStrictBool(opts.lockDiff) ? opts.lockDiff : false;
	o.showInput = Helpers.isStrictBool(opts.showInputDiff) ? opts.showInputDiff : false;
	return difficultyConsistency(o);
}

function normalizeSlider(opts) {
	let o = {
		// showSliderDiff
		sliderStep: 1, // sliderDiffStep
		markerStep: 10, // sliderDiffMarkerStep
		maxMarkers: 15, // sliderMarkersMaxCount
		logScale: false,
		rankMarkers: true
	};

	// if strictly true, returns default values
	if (Helpers.isStrictBool(opts.slider)) {
		return opts.slider ? o : false;
	}
	// When object, overrides defaults and return
	else if (Helpers.hasObjProp(opts.slider)) {
		o = Object.assign({}, o, opts.slider);
	} else if (opts.showSliderDiff === false) {
		return false;
	}

	o.sliderStep = opts.sliderDiffStep > 0 ? opts.sliderDiffStep : o.sliderStep || 1;
	o.markerStep = opts.sliderDiffMarkerStep > 0 ? opts.sliderDiffMarkerStep : o.markerStep || 10;
	o.maxMarkers = opts.sliderMarkersMaxCount > 0 ? opts.sliderMarkersMaxCount : o.maxMarkers || 15;
	o.maxDiffInc = opts.maxDiffInc > 0 ? opts.maxDiffInc : o.maxDiffInc || 2;
	return o;
}

function normalizeWallets(opts) {
	let o = { available: WalletsLib.VALID_WALLETS, initial: WalletsLib.DEFAULT_WALLET };
	if (Helpers.hasObjProp(opts.wallets)) {
		o = Object.assign({}, o, opts.wallets);
	}
	// if (typeof opts.wallets !== 'string' && !Array.isArray(opts.wallets))
	else if (Helpers.hasStrLen(opts.wallets, 0)) {
		if (WalletsLib.isValidWallet(opts.wallets)) o.available = [opts.wallets];
	} else if (Array.isArray(opts.wallets) && opts.wallets.length > 0) {
		o.available = opts.wallets;
	}

	// fixing possible invalid wallets on the list
	o.available = WalletsLib.filterValidWallets(o.available);

	//
	if (Helpers.hasStrLen(opts.initialWallet, 1))
		o.initial = WalletsLib.getValidWallet(opts.initialWallet);
	else if (Helpers.hasStrLen(o.initial, 1)) o.initial = WalletsLib.getValidWallet(o.initial);

	return o;
}

function normalizeOutputs(opts) {
	return opts.outputs || [];
}
