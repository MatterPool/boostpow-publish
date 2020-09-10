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
		if (!newProps.signals || newProps.signals.length == 0) {
			return newProps;
		}

		let contentBoosts = {};
		console.log('props', props);
		console.log('newProps', newProps);

		if (props.content.hash.length == 64) {
			contentBoosts = await BoostHelpers.searchContentHex(props.content.hash, props);
			const CBV = contentBoosts.totalDifficulty_;
			console.log('ContentBoost', props.content.hash, contentBoosts, CBV);
			props.contentBoosts = contentBoosts;
			// const bs0 = contentBoosts.boostSignals[0];
			// const m0 = bs0.boostPowMetadata;
			// const s0 = bs0.boostPowString._blockheader;
			// console.log('ContentBoostHex', bs0, 
			// s0.prevHash, 
			// s0.prevHash.toString(), 
			// new TextDecoder("utf-8").decode(s0.prevHash),
			// new Buffer.from(s0.prevHash).toString('utf-8') 
			// );
			

			// console.log('LogSlider.sliderStateToBoostValue=1', LogSlider.sliderStateToBoostValue(CBV, 1));
			// console.log('LogSlider.sliderStateToBoostValue=0', LogSlider.sliderStateToBoostValue(CBV, 0));
			// console.log(
			// 	'LogSlider.sliderStateToBoostValue=0.5',
			// 	LogSlider.sliderStateToBoostValue(CBV, 0.5)
			// );

			// console.log(
			// 	'LogSlider.boostValueToSliderState=40',
			// 	LogSlider.boostValueToSliderState(40, CBV)
			// );
			// console.log('LogSlider.boostValueToSliderState=1', LogSlider.boostValueToSliderState(1, CBV));
			// console.log(
			// 	'LogSlider.boostValueToSliderState=20.5',
			// 	LogSlider.boostValueToSliderState(20.5, CBV)
			// );

			// console.log(
			// 	'LogSlider.totalBoostAfterSliderState=1',
			// 	LogSlider.totalBoostAfterSliderState(1, CBV)
			// );
			// console.log(
			// 	'LogSlider.totalBoostAfterSliderState=0',
			// 	LogSlider.totalBoostAfterSliderState(0, CBV)
			// );
			// console.log(
			// 	'LogSlider.totalBoostAfterSliderState=0.5',
			// 	LogSlider.totalBoostAfterSliderState(0.5, CBV)
			// );

			// console.log(
			// 	'LogSlider.boostAmountToSliderState=40',
			// 	LogSlider.boostAmountToSliderState(40, CBV)
			// );
			// console.log(
			// 	'LogSlider.boostAmountToSliderState=1',
			// 	LogSlider.boostAmountToSliderState(1, CBV)
			// );
			// console.log(
			// 	'LogSlider.boostAmountToSliderState=20.5',
			// 	LogSlider.boostAmountToSliderState(20.5, CBV)
			// );

			const ranks = LogSlider.GetTopNFromSignals(newProps.signals, CBV);
			console.log("ranks",ranks);
			const newSliderObj = LogSlider.NewContentSliderSpace(CBV, ranks);
			console.log("newSliderObj", newSliderObj);
			console.log('newSliderObj.diffPointsToTopN()', newSliderObj.diffPointsToTopN());
			console.log('newSliderObj.diffPointsToTop1()', newSliderObj.diffPointsToTop1());
			console.log('newSliderObj.diffPointsToRank(1)', newSliderObj.diffPointsToRank(1));
			console.log('newSliderObj.diffPointsToRank(2)', newSliderObj.diffPointsToRank(2));
			console.log('newSliderObj.diffPointsToRank(3)', newSliderObj.diffPointsToRank(3));
			console.log('newSliderObj.rankAfterAddedDiff(919)', newSliderObj.rankAfterAddedDiff(919));
			console.log('newSliderObj.rankAfterAddedDiff(920)', newSliderObj.rankAfterAddedDiff(920));
			console.log('newSliderObj.rankAfterAddedDiff(921)', newSliderObj.rankAfterAddedDiff(921));
			console.log('newSliderObj.rankAfterAddedDiff(999)', newSliderObj.rankAfterAddedDiff(999));
			console.log('newSliderObj.rankAfterAddedDiff(1000)', newSliderObj.rankAfterAddedDiff(1000));
			console.log('newSliderObj.rankAfterAddedDiff(1001)', newSliderObj.rankAfterAddedDiff(1001));
			console.log('newSliderObj.rankAfterAddedDiff(12001)', newSliderObj.rankAfterAddedDiff(12001));

			// TODO: Add new slider parameters to the current slider configuration object
			// Overrides min, max and initial when they are explicitly defined by the user
			if (newSliderObj.MinBoost > 0) newProps.diff.min = newSliderObj.MinBoost;
			if (newSliderObj.MaxBoost > 0) newProps.diff.max = newSliderObj.MaxBoost;
			const toTop1 = newSliderObj.diffPointsToTop1();
			if (toTop1 > 0) newProps.diff.initial = toTop1;

			// Ensures safe initial value
			if (newProps.diff.initial > newProps.diff.max) newProps.diff.initial = newProps.diff.max;

			if (newProps.slider.rankMarkers === true || Array.isArray(newProps.slider.rankMarkers)) {
				let rm = [1, 2, 3, 5, 10];
				if (Array.isArray(newProps.slider.rankMarkers) && newProps.slider.rankMarkers.length > 0) {
					rm = newProps.slider.rankMarkers;
				}
				newProps.slider.sliderRankMarkers = newSliderObj.sliderRankMarkers(rm);
			}
			console.log("newProps",newProps);
		} else {
			// Overrides min, max and initial when they are explicitly defined by the user
			if (props.diff.min > 0) newProps.diff.min = props.diff.min;
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
					let compatProps = ApiCompat.normalizeLegacyApi(userProps);
					compatProps = await updateBoostsRank(compatProps);
					// console.log('Props from USER:', userProps, 'Compatible props: ', compatProps);
					compatProps.opening = true;
					setOpened(true);
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
