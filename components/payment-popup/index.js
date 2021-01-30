import { useState, useEffect } from 'react';
import * as boost from 'boostpow-js';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
//
import Styles from './styles';
import * as Difficulty from './difficulty';
import * as Wallets from './wallets';
import { isValidWallet } from 'app-utils/wallets';

import isHash from 'app-utils/isHash';
import parseContentInput from 'app-utils/parseContentInput';
import parseCategoryInput from 'app-utils/parseCategoryInput';
import parseTopicInput from 'app-utils/parseCategoryInput';
import timeframeToTimestamp from 'app-utils/timeframeToTimestamp';

import fetchContentPreview from 'app-utils/fetchContentPreview';
import BoostCalculator from 'app-utils/boostCalculator';

//import * as BoostHelpers from 'app-utils/boost-helpers';

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

function formatBoostNumber(number) {
	const num = Math.round(number);
	if (num > 9999) return number.toExponential(1);
	return num;
}

const PaymentPopup = compProps => {
	const payProps = compProps.paymentProps;
	const cParent = compProps.parent;

	// Communicates parent to change the opening property to false
	// simulates an "opening phase", to be able to set initial diff, and other initial properties while fetching the api
	if (payProps.opening && cParent) {
		cParent.emit('opened', { ...payProps });
	}

	const topicMaxLength = 20;
	const categoryMaxLength = 4;

	// Initial props (the rendered values)
	const emptyContent = { value: '', type: undefined, preview: undefined };
	const emptySlider = { min: 0, max: 1, value: 0, markers: [] };
	const emptyBoostCalc = BoostCalculator([], { totalDifficulty_: 0 }, payProps.slider.maxDiffInc);

	const initProps = {
		content: { ...emptyContent },
		slider: { ...emptySlider },
		boostCalc: emptyBoostCalc
	};

	if (isHash(payProps.content.hash)) {
		initProps.content.value = payProps.content.hash;
	}
	initProps.topic =
		payProps.topic && payProps.topic.value ? payProps.topic.value.substr(0, topicMaxLength) : '';
	initProps.category =
		payProps.category && payProps.category.value
			? payProps.category.value.substr(0, categoryMaxLength)
			: '';
	initProps.price = 100000000 * payProps.diff.multiplier;
	initProps.opening = true;

	// PROPS

	const [contentInput, setContentInput] = useState(initProps.content.value);
	const [sliderInput, setSliderInput] = useState(emptySlider.value);
	const [categoryInput, setCategoryInput] = useState(initProps.category);
	const [topicInput, setTopicInput] = useState(initProps.topic);
	const [timeframeInput, setTimeframeInput] = useState('fortnight');
	const [priceInput, setPriceInput] = useState(Math.round(initProps.price).toString());

	const [props, setProps] = useState(initProps);

	// parent page reopened widget with new configuration
	if (payProps.opening) {
		if (contentInput !== initProps.content.value) {
			setContentInput(initProps.content.value);
		}
		if (categoryInput !== initProps.category) {
			setCategoryInput(initProps.category);
		}
		if (topicInput !== initProps.topic) {
			setTopicInput(initProps.topic);
		}
		if (priceInput !== initProps.price) {
			setPriceInput(initProps.price);
		}
	}

	async function fieldsUpdated() {

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

		let contentChanged = props.content.value !== newContentValue || newProps.opening;

		let searchChanged =
			props.category !== newCategoryValue ||
			props.topic !== newTopicValue ||
			props.timeframe !== newTimeframeValue ||
			contentChanged;

		let sliderChanged = props.slider.value !== newSliderValue;

		// first time through, nothing has loaded, but content has not changed.
		// so this will force update even though nothing changed.
		newProps.opening = false;

		// content value is not valid, that means you can't rank or boost it
		if (newContentValue === undefined) {
			// clear everything
			newProps.content = { ...emptyContent };
			newProps.slider = { ...emptySlider };
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
				tagutf8: newTopicValue
			};

			let contenthex = isHash(newContentValue)
				? newContentValue
				: Buffer.from(newContentValue, 'utf8').toString('hex');
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

	function handleContentInputChange(evt) {
		setContentInput(evt.target.value);
	}

	function handleSliderInputChange(evt, value) {
		// unifies the value when coming from slider or from input field
		setSliderInput(value >= 0 ? value : evt.target.value);
	}

	function handleCategoryInputChange(evt) {
		setCategoryInput(evt.target.value);
	}

	function handleTopicInputChange(evt) {
		setTopicInput(evt.target.value);
	}

	function handleTimeframeInputChange(evt) {
		setTimeframeInput(evt.target.value);
	}

	function handlePriceInputChange(evt) {
		setPriceInput(evt.target.value);
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
	const showPrice = true && hasContent;

	const showSliderDiff = payProps.slider.show === false ? false : true;
	const sliderMin = props.slider.min;
	const sliderMax = props.slider.max;
	const sliderValue = props.slider.value;
	const sliderMarkers = props.slider.markers;

	const currentBoost = props.boostCalc.currentBoostValue;
	const currentRank = props.boostCalc.currentRank;

	const addedBoost = props.boostCalc.sliderToAddedBoost(sliderValue); 
	const newTotalBoost = props.boostCalc.newTotalBoost(addedBoost);
	const newRank = props.boostCalc.newRank(addedBoost);
	
	const sliderScaleLabel = () => '+' + Math.floor(addedBoost).toString();

	const lockDiff = payProps.diff.disabled === true ? true : false;

	// WALLET PROPS
	const initialWallet = isValidWallet(payProps.wallets.initial) ? payProps.wallets.initial : '';
	const [wallet, setWallet] = useState(initialWallet);
	const [paid, setPaid] = useState(false);
	const [walletProps, setWalletProps] = useState();

	let WalletElem;
	// Avoid rendering wallet while still opening
	if (!payProps.opening && typeof wallet === 'string' && wallet.length > 0) {
		WalletElem = Wallets.getWalletElem(wallet);
	}

	function handleChangeWallet(evt, value) {
		setPaid(false);
		setWallet(evt.target.value);
	}

	// Calculates the value of the outputs to configure the wallet
	function allOutputs() {
		const o = [...(payProps.outputs || [])];

		const boostTopic = Buffer.from(topicInput || '', 'utf8').toString('hex');
		const boostCategory = Buffer.from(categoryInput || 'B', 'utf8').toString('hex');
		const boostContent = isHash(content) ? content : Buffer.from(content, 'utf8').toString('hex');

		try {
			const boostJob = boost.BoostPowJob.fromObject({
				content: boostContent,
				tag: boostTopic,
				category: boostCategory,
				diff: addedBoost
			});

			const latestOutputState = {
				script: boostJob.toASM(),
				amount: Math.max(boostJob.getDiff() * props.price * 0.00000001, 0.00000546),
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
	function getWalletProps() {
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

	const handleClose = () => {
		if (cParent) {
			cParent.emit('close');
		}
	};

	return (
		<div className="boost-publisher-container">
			<div className="boost-publisher-wrapper">
				<div className="boost-publisher-grow" />
				<div className="boost-publisher" onClick={stopEvent}>
					<div className="boost-publisher-header">
						<img src="boost.svg" className="boost-publisher-logo" />
						<span className="boost-logo-text">Boost</span>
						<div className="boost-publisher-grow" />
						<button className="boost-publisher-close" onClick={handleClose}>
							Close
						</button>
					</div>
					{
						<div className="boost-publisher-body">
							<form>
								<div className="form-group">
									{!payProps.content.hash && !hasMessage && (
										<p className="lead">
											What would you like to Boost?{' '}
											<a href="https://boostpow.com" className="pow-help-text" target="_blank">
												What&apos;s Boost?
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
											placeholder="Transaction ID, Twetch, or BitcoinFiles.org link"
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
											{
												<label className="label">
													In the last&nbsp;
													<select
														key="unique-timeframe-selector"
														value={timeframeInput}
														className="input-timeframe"
														onChange={handleTimeframeInputChange}
													>
													<option>hour</option>
													<option>day</option>
													<option>fortnight</option>
													<option>year</option>
													<option>decade</option>
													</select>, 
													this content has been boosted {formatBoostNumber(currentBoost)} and 
													has achieved rank {formatBoostNumber(currentRank)}.
												</label>
											}
										</div>
										<div id="boostpow-slider" className="form-group input-diff-container">
											<Difficulty.DiffSlider
												key="unique-slider"
												min={sliderMin}
												max={sliderMax}
												value={sliderValue}
												step={.001}
												scale={sliderScaleLabel}
												aria-labelledby="discrete-slider-custom"
												valueLabelDisplay="on"
												ValueLabelComponent={Difficulty.DiffValueLabel}
												marks={sliderMarkers}
												onChange={handleSliderInputChange}
												disabled={lockDiff}
											/>
										</div>
										<div className="boost-message">
											{
												<label className="label">
													Boost by {formatBoostNumber(addedBoost)} for a total
													of {formatBoostNumber(newTotalBoost)} to achieve rank {newRank}. 
												</label>
											}
										</div>
									</div>
								)}
								{showPrice && (
									<div id="boostpow-price" className="form-group">
										<div className="lead">Price (sats/difficulty): </div>
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
					}
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
