// Iframe child page. Prepares the widget, connects to parent iFrame and waits for calls
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Postmate from 'postmate';
import PaymentPopup from '../components/payment-popup';
import * as BoostHelpers from '../lib/boost-helpers';
import * as ApiCompat from '../lib/api-compatibility';
import * as LogSlider from '../components/payment-popup/log-slider';

const DEFAULT_PROPS = ApiCompat.normalizeLegacyApi();

const Home = () => {
	const initialProps = DEFAULT_PROPS;

	const [paymentProps, setPaymentProps] = useState();
	const [parent, setParent] = useState(null);
	const [opened, setOpened] = useState(true);
	const updateBoostsRank = async props => {
		// console.log('updateBoostRank', props, original);
		if (!props.boostRank) {
			return props;
		}
		// Fetches the API and rank calcs
		const newProps = await BoostHelpers.prepareBoostProps(props);
		
		let contentBoosts = {};
		// console.log('props', props);
		// console.log('newProps', newProps);

		if (props.content.hash.length == 64) {
			contentBoosts = await BoostHelpers.searchContentHex(props.content.hash, props);
			const CBV = contentBoosts.totalDifficulty_;
			// console.log('ContentBoost', props.content.hash, contentBoosts, CBV);
			props.contentBoosts = contentBoosts;

			const ranksCtrl = LogSlider.GetTopNFromSignals(newProps.signals, CBV);
			const newSliderCtrl = LogSlider.NewContentSliderCtrl(CBV, ranksCtrl, newProps);
			// console.log("newSliderCtrl",newSliderCtrl);
			// TODO: Add new slider parameters to the current slider configuration object
			// Overrides min, max and initial when they are explicitly defined by the user
			newProps.diff.min = 1;
			if (newSliderCtrl.MinBoost > 0) newProps.diff.min = newSliderCtrl.MinBoost;
			if (newSliderCtrl.MaxBoost > 0) newProps.diff.max = newSliderCtrl.MaxBoost;
			// const toTop1 = newSliderCtrl.diffPointsToTop1;
			const toTop1 = newSliderCtrl.Top1Boost;
			if (toTop1 > 0) newProps.diff.initial = toTop1;

			// Ensures safe initial value
			if (newProps.diff.initial > newProps.diff.max) newProps.diff.initial = newProps.diff.max;
			// console.log("toTop1",toTop1, {...newProps});
			if (newProps.slider.rankMarkers === true || Array.isArray(newProps.slider.rankMarkers)) {
				let rm = [1, 2, 3, 5, 10];
				if (Array.isArray(newProps.slider.rankMarkers) && newProps.slider.rankMarkers.length > 0) {
					rm = newProps.slider.rankMarkers;
				}
				newProps.slider.sliderRankMarkers = LogSlider.sliderRankMarkers(newSliderCtrl, rm);
			}
			newProps.sliderCtrl = newSliderCtrl;
			// console.log('newProps', newProps);
		} else {
			// Overrides min, max and initial when they are explicitly defined by the user
			newProps.diff.min = 1;
			// if (props.diff.min > 0) newProps.diff.min = 1; // props.diff.min;
			if (props.diff.max > 0) newProps.diff.max = props.diff.max;
			if (props.diff.initial > 0) newProps.diff.initial = props.diff.initial;

			// Ensures safe initial value
			if (newProps.diff.initial > newProps.diff.max) newProps.diff.initial = newProps.diff.max;
		}
		return newProps;
	};

	const startParentHandshake = async () => {
		if (parent) return; // parent connects only once
		try {
			const parentHandshake = new Postmate.Model({
				open: async userProps => {
					// console.log("Before analyze props", Object.assign({},userProps));
					let compatProps = ApiCompat.normalizeLegacyApi(userProps);
					compatProps = await updateBoostsRank(compatProps);
					// console.log('Props from USER:', userProps, 'Compatible props: ', compatProps);
					compatProps.opening = true;
					setOpened(true);
					// console.log("Before open props", Object.assign({},compatProps));
					setPaymentProps(compatProps);
				},

				// updates the widget as opening false, after widget opened manually
				opened: args => {
					args.opening = false;
					setOpened(true);
					setPaymentProps({ ...args });
				},

				close: () => {
					setOpened(false);
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
			<main>
				{opened && paymentProps && <PaymentPopup paymentProps={paymentProps} parent={parent} />}
			</main>
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
