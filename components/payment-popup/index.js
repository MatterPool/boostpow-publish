import { useState, useEffect } from 'react';
import Styles from './styles';
import snarkdown from 'snarkdown';

import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import * as Difficulty from './difficulty';
import * as Wallets from './wallets';

import * as boost from 'boostpow-js';
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

const PaymentPopup = props => {

	const [paid, setPaid] = useState(false);
	const [tag, setTag] = useState(props.tag);
	const [category, setCategory] = useState(props.category);

	// Wallet
	const [initialWallet] = useState(Wallets.isValidWallet(props.initialWallet) ? props.initialWallet : Wallets.DEFAULT_WALLET);
	const [wallet, setWallet] = useState(initialWallet);
	
	
	// Content
	const [content, setContent] = useState(props.content || '');
	const [contentType, setContentType] = useState(null);
	const [contentPreview, setContentPreview] = useState();
	const [showContentPreview, setShowContentPreview] = useState(
		props.showContentPreview === false ? false : true
	);

	useEffect(() => {
		if (props.showContentPreview === false) {
			setShowContentPreview(false);
		}

		if (props.content) {
			handleContentChange(
				{
					target: {
						value: props.content
					}
				},
				null
			);
		}
	});

	// Difficulty
	const [showInputDiff] = useState(props.showInputDiff === true ? true : false);
	const [lockDiff] = useState(props.lockDiff === true ? true : false);
	const [minDiff] = useState(props.minDiff > 0 ? parseFloat(props.minDiff) : 1);
	const [maxDiff] = useState(props.maxDiff > minDiff ? parseFloat(props.maxDiff) : 40);
	const [initialDiff] = useState(props.initialDiff > 0 ? Difficulty.safeDiffValue(parseFloat(props.initialDiff), minDiff, maxDiff) : 1);
	const [difficulty, setDifficulty] = useState(initialDiff);
	const [showSliderDiff] = useState(props.showSliderDiff === false ? false : true);
	const [sliderDiffStep] = useState(props.sliderDiffStep > 0 ? parseInt(props.sliderDiffStep, 10) : 1);
	const [sliderDiffMarkerStep] = useState(
		props.sliderDiffMarkerStep == 0 || props.sliderDiffMarkerStep == false ? 0 : parseInt(props.sliderDiffMarkerStep, 10) || 10 
	);

	const allOutputs = () => {
		const o = [];
		let defaultFeeMultiplier = 0.00002;
		let defaultTag = undefined;
		let defaultCategory = Buffer.from('B', 'utf8').toString('hex');

		if (props.diffMultiplier) {
			defaultFeeMultiplier = props.diffMultiplier
		}
		if (props.tag) {
			defaultTag = Buffer.from(props.tag, 'utf8').toString('hex')
		}
		if (props.category) {
			defaultCategory = Buffer.from(props.category, 'utf8').toString('hex')
		}

		if (props.outputs && props.outputs.length) {
			props.outputs.forEach((out) => {
				o.push(out);
			});
		}
		try {
			const boostJob = boost.BoostPowJob.fromObject({
				content: content ? content : props.content,
				tag: tag ? Buffer.from(tag, 'utf8').toString('hex') : defaultTag,
				category: category ? Buffer.from(category, 'utf8').toString('hex') : defaultCategory,
				diff: difficulty,
			});

			const latestOutputState = {
				script: boostJob.toASM(),
				amount: Math.max(boostJob.getDiff() * defaultFeeMultiplier, 0.00000546),
				currency: "BSV"
			}
			if (latestOutputState) {
				o.push(latestOutputState);
			}
		} catch (ex) {
			console.log('ex', ex);
			return [];
		}
		return o;
	}

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
				setDifficulty(val % sliderDiffStep === 0 ? val : val-(val % sliderDiffStep));
			}
			else setDifficulty(val);
		}, 100);
	};


	const handleContentChange = async (evt, value) => {
		let content = evt.target.value;
		setContent(content);

		let resp = await fetch(`https://media.bitcoinfiles.org/${content}`, { method: 'HEAD' });
		if (resp.status === 404) {
			setContentType(null);
			return;
		}

		let contentType = resp.headers.get('Content-Type');
		setContentType(contentType);

		if (contentType.match(/^text/)) {
			resp = await fetch(`https://media.bitcoinfiles.org/${content}`);
			let text = await resp.text();
			if (contentType === 'text/markdown; charset=utf-8') {
				setContentPreview(snarkdown(text));
			} else {
				setContentPreview(text);
			}
		}
	};

	const handleTagChange = (evt, value) => {
		setTag(evt.target.value);
	};

	const handleCategoryChange = (evt, value) => {
		setCategory(evt.target.value);
	};

	const handleChangeWallet = (evt, value) => {
		setPaid(false);
		setWallet(evt.target.value);
	};

	const Wallet = Wallets.getWalletElem(wallet);

	const handleClose = () => {
		if (props.parent) {
			props.parent.emit('close');
		}
	};

	const getWalletProps = () => {
		const walletProps = {
			...props,
			outputs: allOutputs(),
			moneybuttonProps: {
				...props.moneybuttonProps,
				onCryptoOperations: cryptoOperations => {
					console.log('onCryptoOperations', cryptoOperations);
					if (props.parent){
						props.parent.emit('cryptoOperations', { cryptoOperations });
					}
				}
			},
			onError: error => {
				// console.log('onError', error);
				if (props.parent){
					props.parent.emit('error', { error });
				}
			},
			onPayment: async(payment) => {
				// console.log('onPayment', payment);
				const boostJobStatus = await boost.Graph().submitBoostJob(payment.rawtx);
				// console.log('boostJobStatus', boostJobStatus);
				const mergedPayment = Object.assign({}, payment, { boostJobStatus: boostJobStatus.result } );
				if (props.parent){
					props.parent.emit('payment', { payment: mergedPayment});
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
						<img src="/logo.svg" />
						<div className="boost-publisher-grow" />
						<p className="boost-publisher-close" onClick={handleClose}>
							Close
						</p>
					</div>
					{props.wallets.length > 1 && !paid &&
						<div className="boost-publisher-body">
							<form>
								<div className="form-group">
									{!props.displayMessage && (
										<p className="lead">
											What would you like to Boost? <a href="https://boostpow.com" className="pow-help-text" target="_blank">What's Boost?</a>
										</p>
									)}
									{props.displayMessage && (
										<p className="lead">
											{props.displayMessage}
										</p>
									)}
									<input onChange={handleContentChange} value={content || ''} type="text" className="input-content" placeholder="Transaction ID, Bitcoin File, Text, Hash, etc.."></input>
                  {(showContentPreview && content) &&
                    <div className='contentPreview'>
                      {contentType === 'video/mp4' &&
                        <video width="320" height="240" controls playsInline autoPlay muted loop>
                          <source
                            src={`https://media.bitcoinfiles.org/${content}`}
                            type="video/mp4"/>
                        </video>
                      }
                      {contentType && contentType.match(/^audio/) &&
                        <audio controls>
                          <source
                            src={`https://media.bitcoinfiles.org/${content}`}/>
                        </audio>
                      }  
                      {contentType === 'video/ogg' &&
                        <video width="320" height="240" controls playsinline autoplay muted loop>
                          <source
                            src={`https://media.bitcoinfiles.org/${content}`}
                            type="video/ogg"/>
                        </video>
                      }  
                      {(contentType && contentType.match(/^image/)) &&
                        <img src={`https://media.bitcoinfiles.org/${content}`}/>
                      }
                      {(contentType && contentType.match(/^text/) && !contentType.match(/^text\/markdown/)) &&
                        <textarea rows="10" readOnly value={contentPreview}>
                        </textarea>
                      }
                      {(contentType && contentType.match(/^text\/markdown/)) &&
                        <div className='markdownPreview' dangerouslySetInnerHTML={{__html: contentPreview}}></div>
                      }
                      {contentType === 'application/pdf' &&
                        <embed className='pdfPreview' style={{width:300}} src={`https://drive.google.com/viewerng/viewer?embedded=true&url=https://media.bitcoinfiles.org/${content}`}/>
                      }
                    </div>
                  }
								</div>
								{props.showTagField && (
									<div className="form-group">
										<p className="lead">
											Tag (optional)
										</p>
										<input maxlength="20" onChange={handleTagChange} value={tag || props.tag} type="text" className="input-content" placeholder="ex: photos, programming, bitcoin..."></input>
									</div>
								)}
								{props.showCategoryField === true && (
									<div className="form-group">
										<p className="lead">
											Category (optional)
										</p>
										<input maxlength="4" onChange={handleCategoryChange} value={category || props.category} type="text" className="input-content" placeholder=""></input>
									</div>
								)}

								<div className="form-group input-diff-container">
									{showSliderDiff && (
										<div>
											<label className="label">Difficulty</label>
											<Difficulty.DiffSlider
												min={minDiff}
												max={maxDiff}
												defaultValue={minDiff}
												value={difficulty}
												aria-labelledby="discrete-slider-custom"
												step={sliderDiffStep}
												valueLabelDisplay="on"
												ValueLabelComponent={Difficulty.DiffValueLabel}
												marks={Difficulty.calculateSliderMarks(minDiff, maxDiff, sliderDiffMarkerStep)}
												onChange={handleDiffChange}
												disabled={lockDiff}
											/>
										</div>
									)}
									{showInputDiff && (
										<div>
											<label className="label">Difficulty</label>
											<select value={difficulty} className="input-diff" onChange={handleDiffChange} disabled={lockDiff}>
												{Difficulty.renderDiffOptions(minDiff, maxDiff, sliderDiffStep)}
											</select>
										</div>
									)}
								</div>
								
							</form>
							<FormControl variant="outlined" margin="dense" className="boost-publisher-form-control">
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
										anchorOrigin: {
											vertical: 'bottom',
											horizontal: 'left'
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
									{Wallets.renderWalletMenuItems(props.wallets)}
								</Select>
							</FormControl>
						</div>
					}
					<div className="boost-publisher-body">
						{!paid && !!allOutputs() && !!allOutputs().length && <Wallet {...getWalletProps()} />}
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
