import { useState, useEffect } from 'react';
import Styles from './styles';
import snarkdown from 'snarkdown';

import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import MoneyButton from '../moneybutton';
import RelayX from '../relayx';
import ProxyPay from '../proxypay';
import * as boost from 'boostpow-js';

const wallets = {
	moneybutton: {
		name: 'Money Button',
		Element: MoneyButton
	},
	relayx: {
		name: 'RelayX',
		Element: RelayX
	},
	proxypay: {
		name: 'Scan QR',
		Element: ProxyPay
	}
};

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

	const [wallet, setWallet] = useState('moneybutton');
	const [paid, setPaid] = useState(false);
	const [tag, setTag] = useState(props.tag);
	const [category, setCategory] = useState(props.category);
	const [difficulty, setDifficulty] = useState(1);
  const [content, setContent] = useState(props.content || '');
  const [contentType, setContentType] = useState(null);
  const [contentPreview, setContentPreview] = useState();
  const [showContentPreview, setShowContentPreview] = useState(props.showContentPreview === false ? false : true);

  useEffect(() => {

    if (props.showContentPreview === false) {
      setShowContentPreview(false);
    }

    if (props.content) {

      handleContentChange({
        target: {
          value: props.content
        }
      }, null)
    }
  })

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

	const handleDiffChange = (evt, value) => {
		setDifficulty(parseFloat(evt.target.value));
	};

	const handleContentChange = async (evt, value) => {

    let content = evt.target.value;

		setContent(content);

    let resp = await fetch(`https://media.bitcoinfiles.org/${content}`, { method: "HEAD" })

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

	const handleChange = (evt, value) => {
		setPaid(false);
		setWallet(evt.target.value);
	};

	const Wallet = wallets[wallet].Element;
	const renderWallet = each => (
		<MenuItem
			classes={{
				root: 'boost-publisher-menu-item',
				selected: 'boost-publisher-menu-item-selected'
			}}
			value={each}
			key={each}
		>
			{wallets[each].name}
		</MenuItem>
	);

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
				if (props.parent){
					props.parent.emit('error', { error });
				}
				console.log('onError', error);
			},
			onPayment: async(payment) => {
				console.log('onPayment', payment);
				const boostJobStatus = await boost.Graph().submitBoostJob(payment.rawtx);
				console.log('boostJobStatus', boostJobStatus);
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

									<label className="label">Energy </label>
									<select defaultValue={difficulty} className="input-diff" onChange={handleDiffChange}>
										<option value="1">1</option>
										<option value="2">2</option>
										<option value="3">3</option>
										<option value="4">4</option>
										<option value="5">5</option>
										<option value="6">6</option>
										<option value="7">7</option>
										<option value="8">8</option>
										<option value="9">9</option>
										<option value="10">10</option>
										<option value="11">11</option>
										<option value="12">12</option>
										<option value="13">13</option>
										<option value="14">14</option>
										<option value="15">15</option>
										<option value="16">16</option>
										<option value="17">17</option>
										<option value="18">18</option>
										<option value="19">19</option>
										<option value="20">20</option>
										<option value="21">21</option>
										<option value="22">22</option>
										<option value="23">23</option>
										<option value="24">24</option>
										<option value="25">25</option>
										<option value="26">26</option>
										<option value="27">27</option>
										<option value="28">28</option>
										<option value="29">29</option>
										<option value="30">30</option>
										<option value="31">31</option>
										<option value="32">32</option>
										<option value="33">33</option>
										<option value="34">34</option>
										<option value="35">35</option>
										<option value="36">36</option>
										<option value="37">37</option>
										<option value="38">36</option>
										<option value="39">39</option>
										<option value="40">40</option>
									</select>
								</div>
							</form>
							<FormControl variant="outlined" margin="dense" className="boost-publisher-form-control">
								<Select
									value={wallet}
									onChange={handleChange}
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
									{Object.keys(wallets)
										.filter(e => props.wallets.find(w => w === e))
										.map(e => renderWallet(e))}
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
