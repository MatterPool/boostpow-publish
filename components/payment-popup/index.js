import { useState, useEffect } from 'react';
import snarkdown from 'snarkdown';
import * as boost from 'boostpow-js';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
//
import Styles from './styles';
import * as Difficulty from './difficulty';
import * as Wallets from './wallets';
import { isValidWallet } from '../../lib/wallets';
import * as LogSlider from './log-slider';
import * as BoostHelpers from '../../lib/boost-helpers';

/*

Example Files
{
  "imageContent": "1cbf1cb5b6c1b72600da298a9c116cb262649ae53db380853508ca2d0bc94b64",
  "videoContent": "1e1c7c06786d4e7979aaaa0f6c9204910cba288741bfa8b95b43027d698e2f90",
  "pdfContent": "4a01a98748fa64db82ff45ce58d55a0c9511fa417110aebe3c33d6221c3b07c0",
  "markdownContent": "a1ef1e13a09b1f58c5ce7e42f7e24c02c529baa4608652b9895d10b25bb30f5a",
  "textContent": "2829b4df5152fb867128f0ea2cffdfe3b7134a98b356eb1a1813b68fd3b83519"
}
*/

function isHash(value) {
	return typeof(value) === 'string' && value.length == 64 && /[a-f0-9]/.test(value);
}

function parseContentInput (inputValue) {

	if (typeof inputValue !== 'string' || inputValue.length === 0) {
		return undefined;
	}

	if (inputValue.startsWith('https://bitcoinfiles.org/t/')){
		let hash = inputValue.slice(27).slice(0,64).toLowerCase();
		if (isHash(hash)) return hash;
	} 

	if (inputValue.startsWith('https://bitcoinfiles.org/tx/')){
		let hash = inputValue.slice(28).slice(0,64).toLowerCase();
		if (isHash(hash)) return hash;
	} 

	if (inputValue.startsWith('https://twetch.app/t/')){
		let hash = inputValue.slice(21).slice(0,64).toLowerCase();
		if (isHash(hash)) return hash;
	} 

	let hash = inputValue.trim().toLowerCase();
	if (isHash(hash)) return hash;

	if (inputValue.length <= 32) {
		return inputValue;
	}

	return undefined;
}

function parseTopicInput (topic) {
	if (typeof topic === 'string' && topic.length > 0) {
		return topic;
	}
	return undefined;
}

function parseCategoryInput (category) {
	if (typeof category === 'string' && category.length > 0) {
		return category;
	}
	return undefined;
}

function parsePriceInput (price) {
	let price_ = parseFloat(price);
	if (price_ > 0) {
		return price_;
	}
}

function timeframeToTimestamp (timeframe) {
	if (timeframe === 'hour') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600;
	}
	if (timeframe === 'day') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24;
	}
	if (timeframe === 'fortnight') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24 * 14;
	}
	if (timeframe === 'year') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24 * 365;
	}
	if (timeframe === 'decade') {
		return parseInt(new Date().getTime() / 1000, 10) - 3600 * 24 * 365 * 10;
	}
	return undefined;
}

async function fetchContentPreview (newContent) {
	let resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`, { method: 'HEAD' });
			
	if (resp.status === 404) {
		return { value: newContent, message: 'NOT_FOUND' };
	}

	let type = resp.headers.get('Content-Type');
	let preview;

	if (type.match(/^text/)) {
		resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`);
		let text = await resp.text();
		if (type === 'text/markdown; charset=utf-8') {
			preview = snarkdown(text);
		} else {
			preview = text;
		}
	}

	return { value: newContent, type, preview };
}

function BoostCalculator (signals, contentBoosts, maxDiffInc) {

	const signalsList = signals && signals.list ? signals.list : [];
	const currentBoostValue = contentBoosts.totalDifficulty_ || 0;

	const ranksCtrl = LogSlider.GetTopNFromSignals(signalsList, currentBoostValue);
	const sliderCtrl = LogSlider.NewContentSliderCtrl(currentBoostValue, ranksCtrl, maxDiffInc);

	const currentRank = Difficulty.getDiffRank(signalsList, currentBoostValue);

	const range = {};
	range.min = sliderCtrl.MinBoost || 1;
	range.max = sliderCtrl.MaxBoost;
	range.initial = Math.min(Math.max(sliderCtrl.Top1Boost+1, range.min), range.max);

	function sliderProps (userConfig, sliderValue) {

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
		}
	}

	function addedBoost (sliderValue) {
		return sliderValue - (range.min-1);
	}

	function newTotalBoost (sliderValue) {
		return currentBoostValue + addedBoost(sliderValue);
	}
	
	function newRank (sliderValue) {
		return LogSlider.rankAfterAddedDiff(currentBoostValue, addedBoost(sliderValue), ranksCtrl.ranks).rank;
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
	}

}

const PaymentPopup = compProps => {
	const payProps = compProps.paymentProps;
	const cParent = compProps.parent;

	payProps.category = { show: true };
	payProps.topic = { show: true };

	// Communicates parent to change the opening property to false
	// simulates an "opening phase", to be able to set initial diff, and other initial properties while fetching the api
	if (payProps.opening && cParent) {
		cParent.emit('opened', { ...payProps });
	}

	const topicMaxLength = 20;
	const categoryMaxLength = 4;

	// Initial props (the rendered values)
	const emptyContent = { value: '', type: undefined, preview: undefined };
	const emptySlider = { min: 1, max: 40, value: 1, diffStep: 1, markers: [] };
	const emptyBoostCalc = BoostCalculator([], { totalDifficulty_: 0 }, payProps.slider.maxDiffInc);
	
	const initProps = { 
		content: {...emptyContent}, 
		slider: { ...emptySlider }, 
		boostCalc: emptyBoostCalc 
	};

	initProps.topic = payProps.topic && payProps.topic.value ? payProps.topic.value.substr(0, topicMaxLength) : '';
	initProps.category = payProps.category && payProps.category.value ? payProps.category.value.substr(0, categoryMaxLength) : '';
	initProps.price = payProps.diff && payProps.diff.multiplier ? payProps.diff.multiplier : 0.0002;
	
	// PROPS

	const [contentInput, setContentInput] = useState('');
	const [sliderInput, setSliderInput] = useState(emptySlider.value);
	const [categoryInput, setCategoryInput] = useState('');
	const [topicInput, setTopicInput] = useState('');
	const [timeframeInput, setTimeframeInput] = useState('day');
	const [priceInput, setPriceInput] = useState(initProps.price.toString());

	const [props, setProps] = useState(initProps);

	async function fieldsUpdated () {
		
		let newProps = { ...props };

		// read input field values, check differences
		let newContentValue = parseContentInput(contentInput);
		let newCategoryValue = parseCategoryInput(categoryInput);
		let newSliderValue = parseFloat(sliderInput);
		let newTopicValue = parseTopicInput(topicInput);
		let newTimeframeValue = timeframeInput;

		// if empty string use the default price, if invalid number don't render
		let newPrice = priceInput === '' ? initProps.price : parseFloat(priceInput) || undefined;
	
		newProps.price = newPrice;

		let contentChanged = props.content.value !== newContentValue;
		
		let searchChanged = props.category !== newCategoryValue
			|| props.topic !== newTopicValue
			|| props.timeframe !== newTimeframeValue
			|| contentChanged;

		let sliderChanged = props.slider.value !== newSliderValue;

		// content value is not valid, that means you can't rank or boost it
		if (newContentValue === undefined) {
			// clear everything
			newProps.content = {...emptyContent};
			newProps.slider = {...emptySlider};
			newProps.boostCalc = emptyBoostCalc;
			setProps(newProps);
			return;
		}

		//	
		// content
		//   ==> content preview
		//
		// content value changed to valid value, that means update the content preview

		if (contentChanged) {
			if (isHash(newContentValue)) {
				newProps.content = await fetchContentPreview(newContentValue);
			} else {
				newProps.content = { value: newContentValue };
			}
		}

		//
		// content
		// category
		// topic (tag)
		// timeframe
		//   ==> ranking
		//
		// search parameters changed, that means query for boost rank

		if (searchChanged) {

			let options = {
				minedTimeFrom: timeframeToTimestamp(newTimeframeValue),
				categoryutf8: newCategoryValue,
				topicutf8: newTopicValue
			};

			let contenthex = isHash(newContentValue) ? newContentValue : Buffer.from(newContentValue, 'utf8').toString('hex');
			let signals = await boost.Graph({}).search(options);
			let contentBoosts = await boost.Graph({}).search({ ...options, contenthex });
			let boostCalc = BoostCalculator(signals, contentBoosts, payProps.slider.maxDiffInc);
			
			newProps.boostCalc = boostCalc;
			newProps.slider = boostCalc.sliderProps(payProps.slider, newSliderValue);
			newProps.timeframe = newTimeframeValue;
			newProps.category = newCategoryValue;
			newProps.topic = newTopicValue;
		}

		if (sliderChanged) {
			newProps.slider = newProps.boostCalc.sliderProps(payProps.slider, newSliderValue);
		}

		// content
		// category
		// topic (tag)
		// timeframe	
		// difficulty slider
		// price
		// wallet
		//   ==> outputs
		//
		// content, search, or difficulty changed, that means update the payment button
		// it will happen on render after setting props
		
		setProps(newProps);
	}

	// when the user stops changing fields for a sec call the update function to get newProps
	useEffect(function () {
		const timer = setTimeout(function () {
			fieldsUpdated().catch(error => console.log(error));
		}, 1000);
	  
		return function () { clearTimeout(timer); }
	}, [ contentInput, categoryInput, topicInput, timeframeInput, priceInput ]);

	useEffect(function () {
		fieldsUpdated().catch(error => console.log(error));
	}, [ sliderInput ])

	function handleContentInputChange (evt) {
		setContentInput(evt.target.value);
	}
	function handleSliderInputChange (evt, value) {
		// unifies the value when coming from slider or from input field
		setSliderInput(value > 0 ? value : evt.target.value);
	}
	function handleCategoryInputChange (evt) {
		setCategoryInput(evt.target.value);
	}
	function handleTopicInputChange (evt) {
		setTopicInput(evt.target.value);
	}
	function handleTimeframeInputChange (evt) {
		setTimeframeInput(evt.target.value);
	}
	function handlePriceInputChange(evt){
		setPriceInput(evt.target.value)
	}

	function stopEvent(evt) {
		evt.preventDefault();
		evt.stopPropagation();
	}

	const hasMessage =
		payProps.message &&
		typeof payProps.message.text === 'string' &&
		payProps.message.text.length > 0;

	const showContent = payProps.content.show === false ? false : true;
	const content = props.content.value;
	const contentType = props.content.type;
	const hasContent = props.content.value !== undefined && props.content.value.length > 0;
	const contentPreview = props.content.preview;

	const showTopic = payProps.topic && payProps.topic.show === true ? true : false;
	const disabledTopic = showTopic && payProps.topic.disabled === true ? true : false;
	
	const showCategory = payProps.category && payProps.category.show === true ? true : false;
	const disabledCategory = showCategory && payProps.category.disabled === true ? true : false;

	const showSliderDiff = payProps.slider.show === false ? false : true;
	const sliderMin = props.slider.min;
	const sliderMax = props.slider.max;
	const sliderValue = props.slider.value;
	const sliderDiffStep = props.slider.diffStep;
	const sliderMarkers = props.slider.markers;

	const currentBoost = props.boostCalc.currentBoostValue;
	const currentRank = props.boostCalc.currentRank;
	const addedBoost = props.boostCalc.addedBoost(sliderValue); 
	const newTotalBoost = props.boostCalc.newTotalBoost(sliderValue);
	const newRank = props.boostCalc.newRank(sliderValue);
	
	const sliderScaleLabel = () => '+' + addedBoost.toString();

	const lockDiff = payProps.diff.disabled === true ? true : false;
	
	const hasRankSignals = props.boostCalc.signals.length > 0;
	const [displayRank, setDisplayRank] = useState(false);
	const toggleDisplayRanks = () => setDisplayRank(!displayRank);
	
	const renderDisplayRanks = () => {
		let html = [];
		props.boostCalc.signals.forEach((v, k)=>{
			html.push((
				<tr key={'display-rank-'+k}>
					<td>{k+1}</td>
					<td> &lt;= {timeframeInput}</td>
					<td>{v.totalDifficulty_}</td>
				</tr>
			));
		});
		return html;
	};

	// WALLET PROPS
	const initialWallet = isValidWallet(payProps.wallets.initial) ? payProps.wallets.initial : '';
	const [wallet, setWallet] = useState(initialWallet);
	const [paid, setPaid] = useState(false);
	const [walletProps, setWalletProps] = useState();

	let WalletElem = Wallets.getWalletElem(wallet);
	// Avoid rendering wallet while still opening
	if (!payProps.opening && typeof wallet === 'string' && wallet.length > 0){
		WalletElem = Wallets.getWalletElem(wallet);
	}

	function handleChangeWallet(evt, value) {
		setPaid(false);
		setWallet(evt.target.value);
	}

	// Calculates the value of the outputs to configure the wallet
	function allOutputs () {
		const o = [...(payProps.outputs||[])];
		
		let defaultTopic = initProps.topic || undefined;
		let defaultCategory = initProps.category || Buffer.from('B', 'utf8').toString('hex');

		const boostContent = isHash(content) ? content : Buffer.from(content, 'utf8').toString('hex');

		try {
			const boostJob = boost.BoostPowJob.fromObject({
				content: boostContent,
				tag: topicInput ? Buffer.from(topicInput, 'utf8').toString('hex') : defaultTopic,
				category: categoryInput ? Buffer.from(categoryInput, 'utf8').toString('hex') : defaultCategory,
				diff: addedBoost
			});

			const latestOutputState = {
				script: boostJob.toASM(),
				amount: Math.max(boostJob.getDiff() * props.price, 0.00000546),
				currency: 'BSV'
			};

			if (latestOutputState) {
				o.push(latestOutputState);
			}
		} catch (ex) {
			return [];
		}
		
		return o;
	}

	// Prepare wallet configuration object
	function getWalletProps () {
		//console.log('rendering wallet');

		let outputs = allOutputs();

		if (outputs.length === 0) {
			return undefined;
		}

		const walletProps = {
			...payProps,
			currentWallet: wallet || '',
			outputs: outputs,
			moneybuttonProps: {
				...payProps.moneybuttonProps,
				onCryptoOperations: cryptoOperations => {
					if (cParent) {
						cParent.emit('cryptoOperations', { cryptoOperations });
					}
				}
			},
			onError: error => {
				if (cParent) {
					cParent.emit('error', { error });
				}
			},
			onPayment: async payment => {
				const boostJobStatus = await boost.Graph().submitBoostJob(payment.rawtx);
				const mergedPayment = Object.assign({}, payment, { boostJobStatus: boostJobStatus.result });
				if (cParent) {
					cParent.emit('payment', { payment: mergedPayment });
				}
				setPaid(true);
				setTimeout(() => {
					setPaid(false);
					handleClose();
				}, 1000);
			}
		};
		return walletProps;
	}

	useEffect(function () {
		setWalletProps(undefined);
		const timer = setTimeout(function () {
			setWalletProps(getWalletProps());
		}, 1000);
	  
		return function () { clearTimeout(timer); }
	}, [ props ]);

	return (
		<div className="boost-publisher-container">
			<div className="boost-publisher-wrapper">
				<div className="boost-publisher-grow" />
				<div className="boost-publisher" onClick={stopEvent}>
					<div className="boost-publisher-header">
						<img src="boost.svg" className="boost-publisher-logo" />
						<span className="boost-logo-text">Boost</span>
						<div className="boost-publisher-grow" />
						<p className="boost-publisher-close">
							Close
						</p>
					</div>
					{(
						<div className="boost-publisher-body">
							<form>
								<div className="form-group">
									{!payProps.content.hash && !hasMessage && (
										<p className="lead">
											What would you like to Boost?{' '}
											<a href="https://boostpow.com" className="pow-help-text" target="_blank">
												What's Boost?
											</a>
										</p>
									)}
									{/* {hasMessage && <p className="lead">{payProps.message.text}</p>} */}
									{hasMessage && (
										<p
											className="lead"
											dangerouslySetInnerHTML={{ __html: payProps.message.text }}
										></p>
									)}
									{!payProps.content.hash && !hasMessage && (
										<input
											onChange={handleContentInputChange}
											value={contentInput}
											type="text"
											className="input-content"
											placeholder="Transaction ID, Bitcoin File, Text, Hash, etc.."
										></input>
									)}
									
									{showContent && hasContent && content && (
										<div className="contentPreview">
											{contentType === 'video/mp4' && (
												<video width="320" height="240" controls playsInline autoPlay muted loop>
													<source
														src={`https://media.bitcoinfiles.org/${content}`}
														type="video/mp4"
													/>
												</video>
											)}
											{contentType && contentType.match(/^audio/) && (
												<audio controls>
													<source src={`https://media.bitcoinfiles.org/${content}`} />
												</audio>
											)}
											{contentType === 'video/ogg' && (
												<video width="320" height="240" controls playsinline autoplay muted loop>
													<source
														src={`https://media.bitcoinfiles.org/${content}`}
														type="video/ogg"
													/>
												</video>
											)}
											{contentType && contentType.match(/^image/) && (
												<img src={`https://media.bitcoinfiles.org/${content}`} />
											)}
											{contentType &&
												contentType.match(/^text/) &&
												!contentType.match(/^text\/markdown/) && (
													<textarea rows="10" readOnly value={contentPreview}></textarea>
												)}
											{contentType && contentType.match(/^text\/markdown/) && (
												<div
													className="markdownPreview"
													dangerouslySetInnerHTML={{ __html: contentPreview }}
												></div>
											)}
											{contentType === 'application/pdf' && (
												<embed
													className="pdfPreview"
													style={{ width: 300 }}
													src={`https://drive.google.com/viewerng/viewer?embedded=true&url=https://media.bitcoinfiles.org/${content}`}
												/>
											)}
										</div>
									)}
								
								</div>
								{showTopic && (
									<div id="boostpow-topic" className="form-group">
										<div className="lead">Topic (optional)</div>
										<div>
											<input
												maxLength="20"
												onChange={handleTopicInputChange}
												value={topicInput}
												type="text"
												className="input-content"
												placeholder="Ex: topic name"
												disabled={disabledTopic}
											></input>
										</div>
									</div>
								)}
								{showCategory && (
									<div id="boostpow-categories" className="form-group">
										<div className="lead">Category (optional)</div>
										<div>
											<input
												maxLength="4"
												onChange={handleCategoryInputChange}
												value={categoryInput}
												type="text"
												className="input-content"
												placeholder="Ex: category name"
												disabled={disabledCategory}
											></input>
										</div>
									</div>
								)}
								
								{hasContent && showSliderDiff && (
									<div>
										<div className="rank-message">
										{(
										<label className="label">
											In the last&nbsp;
											<select
												key='unique-timeframe-selector'
												value={timeframeInput}
												className="input-timeframe"
												onChange={handleTimeframeInputChange}
											>
											<option>hour</option>
											<option>day</option>
											<option>fortnight</option>
											<option>year</option>
											<option>decade</option>
											</select>
											, this content has been boosted {currentBoost} and has achieved rank {currentRank}.
										</label>
										)}
										</div>
										<div id="boostpow-slider" className="form-group input-diff-container">
										<Difficulty.DiffSlider
											key='unique-slider'
											min={sliderMin}
											max={sliderMax}
											value={sliderValue}
											scale={sliderScaleLabel}
											aria-labelledby="discrete-slider-custom"
											step={sliderDiffStep}
											valueLabelDisplay="on"
											ValueLabelComponent={Difficulty.DiffValueLabel}
											marks={sliderMarkers}
											onChange={handleSliderInputChange}
											disabled={lockDiff}
										/>
										</div>
										<div className="boost-message">
										{(
										<label className="label">
											Boost by {addedBoost} for a total of {newTotalBoost} to achieve rank {newRank}. 
											&nbsp;<a onClick={toggleDisplayRanks} className={'display-ranks-toggle' + ((displayRank)?' opened': '')}>Show Ranks</a>
										</label>
										)}
										</div>
									</div>
								)}
								
								<div className="form-group">
									{hasContent && displayRank && hasRankSignals && (
										<div id="display-ranks-container">
										<table className='display-ranks'>
											<thead>
											<tr>
												<th>RANK</th>
												<th>RANK HOURS</th>
												<th>TOTAL BOOST</th>
												<th><a onClick={toggleDisplayRanks} className='display-ranks-close' title="Close ranks table">X</a></th>
											</tr>
											</thead>
											<tbody>
											{renderDisplayRanks()}
											</tbody>
										</table>
										</div>
									)}
								</div>
								{showCategory && (
									<div id="boostpow-price" className="form-group">
										<div className="lead">Price</div>
										<div>
											<input
												onChange={handlePriceInputChange}
												value={priceInput}
												type="text"
												className="input-content"
												placeholder="sats/difficulty"
											></input>
										</div>
									</div>
								)}
							</form>
						</div>
					)}
					<div className="boost-publisher-footer">
						
						{payProps.wallets.available.length > 1 && (
						<div className="wallet-selector">
							<FormControl
								variant="outlined"
								margin="dense"
								className="boost-publisher-form-control"
							>
								<Select
									value={wallet}
									onChange={handleChangeWallet}
									className="boost-publisher-select"
									MenuProps={{
										MenuListProps: {
											classes: {
												root: 'boost-publisher-menu-list'
											}
										},
										transformOrigin: {
											vertical: 'top',
											horizontal: 'left'
										}
									}}
									classes={{
										outlined: 'boost-publisher-select-outlined'
									}}
								>
									{Wallets.renderWalletMenuItems(payProps.wallets.available)}
								</Select>
							</FormControl>
						</div>
						)}
						{hasContent && walletProps && props.price && WalletElem && !paid && (
							<div className="wallet-button">
								<WalletElem {...walletProps} />
							</div>
						)}
						{paid && (
							<div className="payment-completed-section">
								<img
									style={{ margin: '0 auto', display: 'block', height: '70px', width: '70px' }}
									src="/checkmark.svg"
								/>
								<div style={{ textAlign: 'center', marginTop: '16px' }}>Payment Sent</div>
							</div>
						)}
					</div>
					<div className="boost-publisher-bumper" />
				</div>
				<div className="boost-publisher-grow" />
			</div>
			<Styles />
		</div>
	);
};

export default PaymentPopup;
