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

const PaymentPopup = compProps => {
	const rankProps = compProps.boostsRank || {};
	const payProps = compProps.paymentProps;
	// console.log("compProps", compProps);
	const cParent = compProps.parent;

	// Communicates parent to change the opening property to false
	// simulates an "opening phase", to be able to set initial diff, and other initial properties while fetching the api
	if (payProps.opening && cParent) {
		cParent.emit('opened', { ...payProps });
	}

	// GENERAL PROPS
	const [paid, setPaid] = useState(false);
	const [tag, setTag] = useState(payProps.tag);
	const [category, setCategory] = useState(payProps.category);

	// WALLET PROPS
	const initialWallet = isValidWallet(payProps.initialWallet) ? payProps.initialWallet : '';
	const [wallet, setWallet] = useState(initialWallet);
	// If is opening, adjust initialWallet
	if (payProps.opening && initialWallet !== wallet) {
		setWallet(initialWallet);
	}

	// CONTENT PROPS
	const [content, setContent] = useState();
	const [contentType, setContentType] = useState(null);
	const [contentPreview, setContentPreview] = useState();
	const [showContentPreview, setShowContentPreview] = useState(
		payProps.showContentPreview === false ? false : true
	);

	// DIFFICULTY PROPS
	const showInputDiff = payProps.showInputDiff === true ? true : false;
	const lockDiff = payProps.lockDiff === true ? true : false;
	const minDiff = payProps.minDiff > 0 ? parseFloat(payProps.minDiff) : 1;
	const maxDiff = payProps.maxDiff > minDiff ? parseFloat(payProps.maxDiff) : 40;
	const initialDiff =
		payProps.initialDiff > 0 ? Difficulty.safeDiffValue(payProps.initialDiff, minDiff, maxDiff) : 1;
	const [difficulty, setDifficulty] = useState(initialDiff);

	// If is opening, adjust initialDiff
	if (payProps.opening && initialDiff !== difficulty) {
		setDifficulty(initialDiff);
	}

	const showSliderDiff = payProps.showSliderDiff === false ? false : true;
	const sliderDiffStep = payProps.sliderDiffStep > 0 ? parseInt(payProps.sliderDiffStep, 10) : 1;
	let sliderDiffMarkerStep =
		payProps.sliderDiffMarkerStep == 0 || payProps.sliderDiffMarkerStep == false
			? 0
			: parseInt(payProps.sliderDiffMarkerStep, 10) || 10;
	let sliderRankMarkers =
		Array.isArray(rankProps.sliderRankMarkers) && rankProps.sliderRankMarkers.length > 0
			? rankProps.sliderRankMarkers
			: [];
	const sliderMarkersMaxCount =
		payProps.sliderMarkersMaxCount == 0 || payProps.sliderMarkersMaxCount == false
			? 15
			: parseInt(payProps.sliderMarkersMaxCount, 10) || 15;

	// Force slider markers to respect their maximum count limits
	const countMarkers = Math.floor(maxDiff / sliderDiffMarkerStep);
	if (countMarkers > sliderMarkersMaxCount) {
		sliderDiffMarkerStep = Math.round(maxDiff / sliderMarkersMaxCount);
	}

	// Shows slider markers
	let sliderMarkers = Difficulty.calculateSliderMarks(minDiff, maxDiff, sliderDiffMarkerStep);
	if (payProps.getBoostRank && sliderRankMarkers.length > 0) {
		// use rank markers
		sliderMarkers = sliderRankMarkers;
	}

	// GENERAL HANDLERS
	const handleTagChange = (evt, value) => {
		setTag(evt.target.value);
	};

	const handleCategoryChange = (evt, value) => {
		setCategory(evt.target.value);
	};

	const clearContent = () => {
		setContent(null);
		setContentType(null);
		setContentPreview('');
	};

	const handleClose = () => {
		if (cParent) {
			clearContent();
			cParent.emit('close');
		}
	};

	// CONTENT HANDLERS

	// Fetch and update the content
	const handleContentChange = async (evt, value) => {
		let newContent = evt.target.value;

		// Prevents multiple content reloads from the api if it did not changed
		if (content == newContent) return;

		setContent(newContent);

		let resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`, { method: 'HEAD' });
		if (resp.status === 404) {
			setContentType(null);
			return;
		}

		let contentType = resp.headers.get('Content-Type');
		setContentType(contentType);

		if (contentType.match(/^text/)) {
			resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`);
			let text = await resp.text();
			if (contentType === 'text/markdown; charset=utf-8') {
				setContentPreview(snarkdown(text));
			} else {
				setContentPreview(text);
			}
		}
	};

	// Trigger content rendering when content changes
	useEffect(() => {
		if (payProps.showContentPreview === false) {
			setShowContentPreview(false);
		}

		if (payProps.content) {
			handleContentChange(
				{
					target: {
						value: payProps.content
					}
				},
				null
			);
		}
	});

	// WALLET HANDLERS
	let Wallet;
	// Avoid rendering wallet while still opening
	if (!payProps.opening && typeof wallet === 'string' && wallet.length > 0)
		Wallet = Wallets.getWalletElem(wallet);

	const handleChangeWallet = (evt, value) => {
		setPaid(false);
		setWallet(evt.target.value);
	};

	// Calculates the value of the outputs to configure the wallet
	const allOutputs = from => {
		const o = [];
		let defaultFeeMultiplier = 0.00002;
		let defaultTag = undefined;
		let defaultCategory = Buffer.from('B', 'utf8').toString('hex');

		if (payProps.diffMultiplier) {
			defaultFeeMultiplier = payProps.diffMultiplier;
		}
		if (payProps.tag) {
			defaultTag = Buffer.from(payProps.tag, 'utf8').toString('hex');
		}
		if (payProps.category) {
			defaultCategory = Buffer.from(payProps.category, 'utf8').toString('hex');
		}

		if (payProps.outputs && payProps.outputs.length) {
			payProps.outputs.forEach(out => {
				o.push(out);
			});
		}
		try {
			const boostJob = boost.BoostPowJob.fromObject({
				content: content ? content : payProps.content,
				tag: tag ? Buffer.from(tag, 'utf8').toString('hex') : defaultTag,
				category: category ? Buffer.from(category, 'utf8').toString('hex') : defaultCategory,
				diff: difficulty
			});

			const latestOutputState = {
				script: boostJob.toASM(),
				amount: Math.max(boostJob.getDiff() * defaultFeeMultiplier, 0.00000546),
				currency: 'BSV'
			};
			if (latestOutputState) {
				o.push(latestOutputState);
			}
		} catch (ex) {
			console.log('ex', ex);
			return [];
		}
		return o;
	};

	// Prepare wallet configuration object
	const getWalletProps = () => {
		const walletProps = {
			...payProps,
			currentWallet: wallet || '',
			outputs: allOutputs(),
			moneybuttonProps: {
				...payProps.moneybuttonProps,
				onCryptoOperations: cryptoOperations => {
					// console.log('onCryptoOperations', cryptoOperations);
					if (cParent) {
						cParent.emit('cryptoOperations', { cryptoOperations });
					}
				}
			},
			onError: error => {
				// console.log('onError', error);
				if (cParent) {
					cParent.emit('error', { error });
				}
			},
			onPayment: async payment => {
				// console.log('onPayment', payment);
				const boostJobStatus = await boost.Graph().submitBoostJob(payment.rawtx);
				// console.log('boostJobStatus', boostJobStatus);
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
	};

	// DIFFICULTY HANDLERS

	// This timeout controls a minimum time between changes to avoid money button multiple renders
	let diffTimeout = null;
	const handleDiffChange = (evt, value) => {
		// unifies the value when comming from slider or from input field
		const val = value > 0 ? parseFloat(value) : parseFloat(evt.target.value);
		if (val === difficulty) return;
		// I think it would be better to put this timeout on the money button render function itself
		// because this timeout causes a little lag when dragging the slider marker
		clearTimeout(diffTimeout);
		diffTimeout = setTimeout(() => {
			// ensure minimun difficulty
			if (val <= minDiff) setDifficulty(minDiff);
			// ensure maximum difficulty
			else if (val >= maxDiff) setDifficulty(maxDiff);
			// if using sliders and having larger steps, ensure the slider value will be set to a mod zero value
			else if (showSliderDiff && sliderDiffStep > 1) {
				setDifficulty(val % sliderDiffStep === 0 ? val : val - (val % sliderDiffStep));
			} else setDifficulty(val);
		}, 50);
	};

	return (
		<div className="boost-publisher-container" onClick={handleClose}>
			<div className="boost-publisher-wrapper">
				<div className="boost-publisher-grow" />
				<div
					className="boost-publisher"
					onClick={evt => {
						evt.preventDefault();
						evt.stopPropagation();
					}}
				>
					<div className="boost-publisher-header">
						<img src="boost.svg" className="boost-publisher-logo" />
						<span className="boost-logo-text">Boost</span>
						<div className="boost-publisher-grow" />
						<p className="boost-publisher-close" onClick={handleClose}>
							Close
						</p>
					</div>
					{payProps.wallets.length >= 1 && !paid && (
						<div className="boost-publisher-body">
							<form>
								<div className="form-group">
									{!payProps.content && !payProps.displayMessage && (
										<p className="lead">
											What would you like to Boost?{' '}
											<a href="https://boostpow.com" className="pow-help-text" target="_blank">
												What's Boost?
											</a>
										</p>
									)}
									{/* {payProps.displayMessage && <p className="lead">{payProps.displayMessage}</p>} */}
									{payProps.displayMessage && (
										<p
											className="lead"
											dangerouslySetInnerHTML={{ __html: payProps.displayMessage }}
										></p>
									)}
									{!payProps.content && !payProps.displayMessage && (
										<input
											onChange={handleContentChange}
											value={content || ''}
											type="text"
											className="input-content"
											placeholder="Transaction ID, Bitcoin File, Text, Hash, etc.."
										></input>
									)}
									{showContentPreview && content && (
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
								{payProps.showTagField && (
									<div id="boostpow-tags" className="form-group">
										<div className="lead">Tags (optional)</div>
										<div>
											<input
												maxLength="20"
												onChange={handleTagChange}
												value={tag || payProps.tag}
												type="text"
												className="input-content"
												placeholder="ex: photos, programming, bitcoin..."
											></input>
										</div>
									</div>
								)}
								{payProps.showCategoryField === true && (
									<div id="boostpow-categories" className="form-group">
										<div className="lead">Categories (optional)</div>
										<div>
											<input
												maxLength="4"
												onChange={handleCategoryChange}
												value={category || payProps.category}
												type="text"
												className="input-content"
												placeholder=""
											></input>
										</div>
									</div>
								)}

								<div className="form-group input-diff-container">
									{showSliderDiff && (
										<div>
											<label className="label">
												Difficulty {difficulty}
												{/* {Difficulty.hasRankSignals(rankProps) && <span> leads to the Rank {Difficulty.getDiffRank(rankProps.signals, difficulty)}</span>} */}
											</label>
											<Difficulty.DiffSlider
												min={minDiff}
												max={maxDiff}
												value={difficulty}
												aria-labelledby="discrete-slider-custom"
												step={sliderDiffStep}
												valueLabelDisplay="on"
												ValueLabelComponent={Difficulty.DiffValueLabel}
												marks={sliderMarkers}
												onChange={handleDiffChange}
												disabled={lockDiff}
											/>
										</div>
									)}
									{showInputDiff && (
										<div>
											<label className="label">Difficulty</label>
											<select
												value={difficulty}
												className="input-diff"
												onChange={handleDiffChange}
												disabled={lockDiff}
											>
												{Difficulty.renderDiffOptions(minDiff, maxDiff, sliderDiffStep)}
											</select>
										</div>
									)}
									{Difficulty.hasRankSignals(rankProps) && (
										<div className="boost-rank-display">
											This post will appear at{' '}
											<span>Rank {Difficulty.getDiffRank(rankProps.signals, difficulty)}</span>
											&nbsp; of all Boosted content on the last{' '}
											<span>{payProps.rankHours} hours</span>.
										</div>
									)}
								</div>
							</form>
							{payProps.wallets.length > 1 && (
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
										{Wallets.renderWalletMenuItems(payProps.wallets)}
									</Select>
								</FormControl>
							)}
						</div>
					)}
					<div className="boost-publisher-body">
						{Wallet && !paid && !!allOutputs() && !!allOutputs().length && (
							<Wallet {...getWalletProps()} />
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
