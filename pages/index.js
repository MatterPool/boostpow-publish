// Iframe child page. Prepares the widget, connects to parent iFrame and waits for calls
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Postmate from 'postmate';
import PaymentPopup from '../components/payment-popup';
import { VALID_WALLETS, getValidWallet } from '../lib/wallets';
import * as BoostHelpers from '../lib/boost-helpers';
import * as ApiCompat from '../lib/api-compatibility';

const Home = () => {

	const initialProps = {
		wallets: VALID_WALLETS,
		getBoostRank: true,
		rankHours: 24,
		initialWallet: 'moneybutton',
		/*outputs: [
			{
				to: "18YCy8VDYcXGnekHC4g3vphnJveTskhCLf", amount: 0.0004, currency: 'BSV'
			}
		],
    	showContentPreview: true,
		content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09',
		tag: 'bitcoin',
		category: 'B' // defaults to 'B' underneath.
		*/
		// content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09',
		// initialWallet: 'moneybutton', // 'moneybutton' or 'relayx'
		// tag: '$',
		// showTagField: false, // defaults to true
		// showCategoryField: false, // defaults to false
		// minDiff: 1, // defaults to 1; ignored if getBoostRank is true
		// maxDiff: 40, // defaults to 40; ignored if getBoostRank is true
		// initialDiff: 1, // defaults to the minimal difficulty or 1; ignored if getBoostRank is true
		// diffMultiplier: 0.00002, // defaults to 0.00002
		// lockDiff: false, // defaults to false
		// showInputDiff: false, // defaults to false
		// showSliderDiff: true, // defaults to true
		// sliderDiffStep: 1, // defaults to 1
		// sliderDiffMarkerStep: 10, // defaults to 10, use 0 to disable markers
		// sliderMarkersMaxCount: 15, // defaults to 15
		// displayMessage: 'hello world',
	};

	const [paymentProps, setPaymentProps] = useState();
	const [parent, setParent] = useState(null);
	const [opened, setOpened] = useState(true);
	const [boostsRank, setBoostsRank] = useState({});
	const updateBoostsRank = async props => {
		if (props.getBoostRank !== true) {
			setBoostsRank({});
			return props;
		}
		// Fetches the API and rank calcs
		const newProps = await BoostHelpers.prepareBoostProps(props);
		if (!newProps.signals || newProps.signals.length == 0) {
			setBoostsRank({});
			return newProps;
		}
		newProps.minDiff = 1;
		// If user defined maxDiff, then overrides boost rank maxDiff
		if (props.maxDiff > 0) newProps.maxDiff = props.maxDiff;
		if (newProps.initialDiff > newProps.maxDiff) newProps.initialDiff = newProps.maxDiff;
		setBoostsRank(newProps);
		return newProps;
	};

	const startParentHandshake = async () => {
		if (parent) return; // parent connects only once
		try {
			const parentHandshake = new Postmate.Model({
				open: async userProps => {
					console.log("compatible API", userProps, ApiCompat.normalizeLegacyApi(userProps));
					// Ensure getBoostRank is true as default
					if (userProps.getBoostRank === undefined) userProps.getBoostRank = true;
					userProps = await updateBoostsRank(userProps);

					let localProps = Object.assign(
						{},
						initialProps || {},
						paymentProps || {},
						userProps || {}
					);

					// Ensures a valid initial wallet id
					localProps.initialWallet = getValidWallet(localProps.initialWallet);
					localProps.opening = true;
					setOpened(true);
					// console.log("localProps",localProps, userProps);
					setPaymentProps(localProps);
				},

				// updates the widget as opening false, after widget opened manually
				opened: args => {
					args.opening = false;
					setOpened(true);
					setPaymentProps({ ...args });
				},

				close: () => {
					setOpened(false)
				}

			});

			//
			parentHandshake.then(p => {
				p.emit('init', true);
				setParent(p);
			});

			// If it is in dev mode, directly on publish page, so this will trigger an error
			parentHandshake.emit('init', true);
		} catch (err) {
			// If error, set initial properties
			setPaymentProps(initialProps);
		}

	};

	const checkParentHandshake = async () => {
		try {
			await startParentHandshake();
		} catch (e) {
			await startParentHandshake();
		}
	};

	useEffect(() => {
		if (!parent) {
			checkParentHandshake();
		}
	}, [parent]);

	return (
		<div className="container">
			<Head>
				<title>Boost POW Publisher</title>
				<link rel="icon" href="/favicon.png" />
				<link rel="stylesheet" href="https://use.typekit.net/kwm6mcp.css" />
			</Head>
			<main>{opened && paymentProps && 
			<PaymentPopup paymentProps={paymentProps} parent={parent} boostsRank={boostsRank} />
			}</main>
			<style jsx global>{`
				html,
				body {
					height: 100%;
					max-height: 100%;
					padding: 0;
					margin: 0;
					font-family: proxima-nova, Helvetica;
				}

				* {
					box-sizing: border-box;
				}
			`}</style>
		</div>
	);
};

export default Home;
