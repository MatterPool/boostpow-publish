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
	const payProps = compProps.paymentProps;
	const cParent = compProps.parent;

	// Communicates parent to change the opening property to false
	// simulates an "opening phase", to be able to set initial diff, and other initial properties while fetching the api
	if (payProps.opening && cParent) {
		cParent.emit('opened', { ...payProps });
	}

	// GENERAL PROPS
	const [paid, setPaid] = useState(false);

	const tagMaxLength = 20;
	const hasTag = payProps.tag && typeof payProps.tag.value === 'string';
	const showTag = hasTag && payProps.tag.show === true ? true : false;
	const disabledTag = hasTag && showTag && payProps.tag.disabled === true ? true : false;
	const initialTagValue = payProps.tag && payProps.tag.value ? payProps.tag.value.substr(0, tagMaxLength) : '';
	const [tag, setTag] = useState(initialTagValue);
	if (payProps.opening && initialTagValue !== tag) {
		setTag(initialTagValue);
	}

	const categoryMaxLength = 4;
	const hasCategory = payProps.category && typeof payProps.category.value === 'string';
	const showCategory = hasCategory && payProps.category.show === true ? true : false;
	const disabledCategory = hasCategory && showCategory && payProps.category.disabled === true ? true : false;
	const initialCategoryValue = payProps.category && payProps.category.value ? payProps.category.value.substr(0, categoryMaxLength) : '';
	const [category, setCategory] = useState(initialCategoryValue);
	if (payProps.opening && initialCategoryValue !== category) {
		setCategory(initialCategoryValue);
	}
	
	// WALLET PROPS
	const initialWallet = isValidWallet(payProps.wallets.initial) ? payProps.wallets.initial : '';
	const [wallet, setWallet] = useState(initialWallet);
	// If is opening, adjust initialWallet
	if (payProps.opening && initialWallet !== wallet) {
		setWallet(initialWallet);
	}

	// MESSAGE
	const hasMessage =
		payProps.message &&
		typeof payProps.message.text === 'string' &&
		payProps.message.text.length > 0;

	// CONTENT PROPS
	const [content, setContent] = useState(payProps.content.hash.length > 0 ? payProps.content.hash : '');
	const [hasContent, setHasContent] = useState(content && content.length > 0);
	const [contentType, setContentType] = useState(null);
	const [contentPreview, setContentPreview] = useState();
	var showContent = payProps.content.show === false ? false : true;
	if (payProps.opening && content !== payProps.content.hash) {
		setContent(payProps.content.hash);
	}

	// DIFFICULTY PROPS
	const _diff = payProps.diff || {};
	const showInputDiff = _diff && _diff.showInput === true ? true : false;
	const lockDiff = _diff.disabled === true ? true : false;
	const minDiff = _diff.min > 0 ? parseFloat(_diff.min) : 1;
	const maxDiff = _diff.max > minDiff ? parseFloat(_diff.max) : 40;
	const initialDiff =
		_diff.initial > 0 ? Difficulty.safeDiffValue(_diff.initial, minDiff, maxDiff) : 1;
	const [difficulty, setDifficulty] = useState(initialDiff);

	// If is opening, adjust initialDiff
	if (payProps.opening && initialDiff !== difficulty) {
		setDifficulty(initialDiff);
	}
	const _slider = payProps.slider || {};
	const showSliderDiff = _slider.show === false ? false : true;
	const sliderDiffStep = _slider.sliderStep > 0 ? parseInt(_slider.sliderStep, 10) : 1;
	let sliderDiffMarkerStep =
		_slider.markerStep == 0 || _slider.markerStep == false
			? 0
			: parseInt(_slider.markerStep, 10) || 10;
	let sliderRankMarkers =
		Array.isArray(_slider.sliderRankMarkers) && _slider.sliderRankMarkers.length > 0
			? _slider.sliderRankMarkers
			: [];
	const sliderMarkersMaxCount =
		_slider.maxMarkers == 0 || _slider.maxMarkers == false
			? 15
			: parseInt(_slider.maxMarkers, 10) || 15;

	// Force slider markers to respect their maximum count limits
	const countMarkers = Math.floor(maxDiff / sliderDiffMarkerStep);
	if (countMarkers > sliderMarkersMaxCount) {
		sliderDiffMarkerStep = Math.round(maxDiff / sliderMarkersMaxCount);
	}

	// Shows slider markers
	let sliderMarkers = Difficulty.calculateSliderMarks(minDiff, maxDiff, sliderDiffMarkerStep);
	if (payProps.boostRank && sliderRankMarkers.length > 0) {
		// use rank markers
		sliderMarkers = sliderRankMarkers;
	}

	const [displayRank, setDisplayRank] = useState(false);
	const toggleDisplayRanks = () => {
		setDisplayRank(!displayRank);
	}
	if (payProps.opening && displayRank !== false) {
		setDisplayRank(false);
	}

	const renderDisplayRanks = () => {
		let html = [];
		payProps.signals.forEach((v, k)=>{
			html.push((
				<tr key={'display-rank-'+k}>
					<td>{k+1}</td>
					<td> &lt;= {payProps.boostRank.hours}</td>
					<td>{v.totalDifficulty_}</td>
				</tr>
			));
		})
		return html;
	};
	

	// GENERAL HANDLERS
	const handleTagChange = (evt, value) => {
		setTag(evt.target.value);
	};

	const handleCategoryChange = (evt, value) => {
		setCategory(evt.target.value);
	};


	const handleClose = () => {
		if (cParent) {
			cParent.emit('close');
		}
	};

	// CONTENT HANDLERS

	// Fetch and update the content
	const handleContentChange = async (evt, value) => {
		let newContent = evt.target.value;
		if (typeof newContent === 'string' && newContent.length == 0) {
			setContent('');
			return;
		}
		// Prevents multiple content reloads from the api if it did not changed
		if (content == newContent && contentType > '') return;

		setContent(newContent);
		setHasContent(true);

		// Do not query content if hash is not 64 bytes long
		if (newContent.length == 64){
			let resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`, { method: 'HEAD' });
			if (resp.status === 404) {
				setContent('');
				setContentType(null);
				return;
			}

			let type = resp.headers.get('Content-Type');
			setContentType(type);

			if (type.match(/^text/)) {
				resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`);
				let text = await resp.text();
				if (type === 'text/markdown; charset=utf-8') {
					setContentPreview(snarkdown(text));
				} else {
					setContentPreview(text);
				}
			}
		}
	};

	// Trigger content rendering when content changes
	useEffect(() => {
		if (payProps.content && payProps.content.hash) {
			handleContentChange(
				{
					target: {
						value: payProps.content.hash
					}
				},
				null
			);
		}
	}, [ content ]); // only handle this if content changes

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

		if (payProps.diff.multiplier) {
			defaultFeeMultiplier = payProps.diff.multiplier;
		}
		if (payProps.tag && payProps.tag.value) {
			defaultTag = Buffer.from(payProps.tag.value.substr(0, tagMaxLength), 'utf8').toString('hex');
		}
		if (payProps.category && payProps.category.value) {
			defaultCategory = Buffer.from(payProps.category.value.substr(0, categoryMaxLength), 'utf8').toString('hex');
		}

		if (payProps.outputs && payProps.outputs.length) {
			payProps.outputs.forEach(out => {
				o.push(out);
			});
		}

		const boostContent = content ? content : payProps.content.hash;
		// Only prepare boost jobs for content string with even length numbers, otherwise it is an invalid hex string
		if (boostContent.length > 0 && boostContent.length % 2 == 0){
			try {
				const boostJob = boost.BoostPowJob.fromObject({
					content: content ? content : payProps.content.hash,
					tag: tag ? Buffer.from(tag, 'utf8').toString('hex') : defaultTag,
					category: category ? Buffer.from(category, 'utf8').toString('hex') : defaultCategory,
					diff: AddedBoost
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
				return [];
			}
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
			} else {
				setDifficulty(val);
			}
		}, 50);
	};

	let AddedBoost = 1;
	if (payProps.sliderCtrl && payProps.sliderCtrl.content) {
		AddedBoost = LogSlider.getAddedBoost(payProps.sliderCtrl, difficulty);
	}

	const sliderScaleLabel = (x) => {
		return LogSlider.sliderScaleLabel(payProps.sliderCtrl, x);
	};

	const hasRankSignals = Difficulty.hasRankSignals(payProps);

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
					{payProps.wallets.available.length >= 1 && !paid && (
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
											onChange={handleContentChange}
											value={content || ''}
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

								{showTag && (
									<div id="boostpow-tags" className="form-group">
										<div className="lead">Tag (optional)</div>
										<div>
											<input
												maxLength="20"
												onChange={handleTagChange}
												value={tag}
												type="text"
												className="input-content"
												placeholder="Ex: tag name"
												disabled={disabledTag}
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
												onChange={handleCategoryChange}
												value={category}
												type="text"
												className="input-content"
												placeholder="Ex: category name"
												disabled={disabledCategory}
											></input>
										</div>
									</div>
								)}

								<div id="boostpow-slider" className="form-group input-diff-container">
									{hasContent && showSliderDiff && (
										<div>
											<div className="slider-message">
											{ payProps.sliderCtrl && (
											<label className="label">Current boost of {payProps.sliderCtrl.content.CurrentBoost} <big><b>+</b></big> <select
											value={difficulty}
											className="inline-diff-selector"
											onChange={handleDiffChange}
											disabled={lockDiff}>
											{Difficulty.renderDiffOptions(minDiff, maxDiff, sliderDiffStep, "")}
										</select> boosts =&nbsp;
											{payProps.sliderCtrl.content.CurrentBoost + AddedBoost} total boost</label>
											)}
											</div>
											
											<Difficulty.DiffSlider
											 	key='unique-slider'
												min={minDiff}
												max={maxDiff}
												value={difficulty}
												scale={sliderScaleLabel}
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
												key='unique-diff-selector'
												value={difficulty}
												className="input-diff"
												onChange={handleDiffChange}
												disabled={lockDiff}
											>
												{Difficulty.renderDiffOptions(minDiff, maxDiff, sliderDiffStep)}
											</select>
										</div>
									)}
									
								</div>
								<div className="form-group">
								{hasContent && hasRankSignals && (
										<div className="boost-rank-display">
											{/* This post will appear at{' '}*/}
											Leads to {payProps.sliderCtrl &&
											<span>Rank {LogSlider.rankAfterAddedDiff(payProps.sliderCtrl.content.CurrentBoost, AddedBoost, payProps.sliderCtrl.ranksCtrl.ranks).rank}</span>
											}
											{!payProps.sliderCtrl &&
											<span>Rank {Difficulty.getDiffRank(payProps.signals, difficulty)}</span>
											}
											&nbsp; of <a onClick={toggleDisplayRanks} className={'display-ranks-toggle' + ((displayRank)?' opened': '')}>boosts ranked</a> on the last{' '}
											<span>{payProps.boostRank.hours} hours</span>.
										</div>
									)}
								</div>
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
						{hasContent && Wallet && !paid && !!allOutputs() && !!allOutputs().length && (
							<div className="wallet-button">
								<Wallet {...getWalletProps()} />
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
