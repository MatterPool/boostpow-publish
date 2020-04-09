import { useState } from 'react';
import Styles from './styles';

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

const outputs = [
];

const PaymentPopup = props => {
	const [wallet, setWallet] = useState('moneybutton');
	const [paid, setPaid] = useState(false);
	const [content, setContent] = useState('content');
	const [difficulty, setDifficulty] = useState(1);

	const allOutputs = () => {
		const o = [];
		outputs.forEach((out) => {
			o.push(out);
		});
		try {
			const boostJob = boost.BoostPowJob.fromObject({
				content: content,
				category: Buffer.from('B', 'utf8').toString('hex'),
				diff: difficulty,
			});
			const latestOutputState = {
				script: boostJob.toASM(),
				amount: Math.max(boostJob.getDiff() * 0.00002, 0.00000546),
				currency: "BSV"
			}
			if (latestOutputState) {
				o.push(latestOutputState);
			}
		} catch (ex) {
			console.log('ex', ex);
			throw ex;
		}
		console.log('o', o);
		return o;
	}

	const handleDiffChange = (evt, value) => {
		setDifficulty(parseFloat(evt.target.value));
	};

	const handleContentChange = (evt, value) => {
		if (!evt.target.value || evt.target.value.length !== 64) {
			return;
		}
		setContent(evt.target.value);
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

	const walletProps = {
		outputs: allOutputs(),
		...props,
		moneybuttonProps: {
			...props.moneybuttonProps,
			onCryptoOperations: cryptoOperations => {
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
			if (props.parent){
				props.parent.emit('payment', { payment });
			}
			const boostJobStatus = await boost.Graph().submitBoostJob(payment.rawtx);
			console.log('onPayment', payment, boostJobStatus);
			setPaid(true);
			setTimeout(() => {
				setPaid(false);
				handleClose();
			}, 5000);
		}
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
					{props.wallets.length > 1 && !paid && (
						<div className="boost-publisher-body">
							<p className="lead">
								What would you like to Boost? <a href="https://boostpow.com" className="pow-help-text" target="_blank">What's Boost?</a>
							</p>
							<div className="input-content-container">
								<input onChange={handleContentChange} type="text" className="input-content" placeholder="Transaction ID, Bitcoin File, Text, Hash, etc.."></input>
							</div>
							<div className="input-diff-container">
								<label className="label">Energy: </label>
								<select className="input-diff" onChange={handleDiffChange}>
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
								</select>
							</div>

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
					)}
					<div className="boost-publisher-body">
						{!paid && <Wallet {...walletProps} />}
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
