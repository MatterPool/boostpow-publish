// Iframe child page. Prepares the widget, connects to parent iFrame and waits for calls
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Postmate from 'postmate';
import PaymentPopup from '../components/payment-popup';
import { VALID_WALLETS } from '../components/payment-popup/wallets';
import * as BoostHelpers from '../lib/boost-helpers';

const Home = () => {

	const initialProps = {
		wallets: VALID_WALLETS
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
		// initialWallet: 'moneybutton',
		// tag: '$',
		// showTagField: false, // defaults to true
		// showCategoryField: false, // defaults to false
		// minDiff: 1, // defaults to 1
		// maxDiff: 40, // defaults to 40
		// diffMultiplier: 0.00002, // defaults to 0.00002
		// initialDiff: 1, // defaults to the minimal difficulty or 1
		// lockDiff: false, // defaults to false
		// showInputDiff: false, // defaults to false
		// showSliderDiff: true, // defaults to true
		// sliderDiffStep: 1, // defaults to 1
		// sliderDiffMarkerStep: 10, // defaults to 10, use 0 to disable markers
		// displayMessage: 'hello world',
	};

	const [paymentProps, setPaymentProps] = useState();
	const [parent, setParent] = useState(null);
	
	const [boostsRank, setBoostsRank] = useState();
	const updateBoosts = async props => {
		props = await BoostHelpers.prepareBoostProps(props);
		setBoostsRank(props);
		return props;
	};

	const startParentHandshake = async () => {
		if (parent) return; // parent connects only once
		try {
			const parentHandshake = new Postmate.Model({
				open: async userProps => {
					if (userProps.getBoostRank) {
						userProps = await updateBoosts(userProps);
					}
					let localProps = Object.assign(
						{},
						initialProps || {},
						paymentProps || {},
						userProps || {}
					);
					localProps.opening = true;
					setPaymentProps(localProps);
				},

				// updates the widget as opening false, after widget opened manually
				opened: args => {
					args.opening = false;
					setPaymentProps({ ...args });
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
			<main>{paymentProps && <PaymentPopup paymentProps={paymentProps} parent={parent} />}</main>
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
