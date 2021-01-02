// Iframe child page. Prepares the widget, connects to parent iFrame and waits for calls
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Postmate from 'postmate';
import PaymentPopup from '../components/payment-popup';
import * as ApiCompat from '../lib/api-compatibility';

const DEFAULT_PROPS = ApiCompat.normalizeLegacyApi();

const Home = () => {
	const initialProps = DEFAULT_PROPS;

	const [paymentProps, setPaymentProps] = useState();
	const [parent, setParent] = useState(null);
	const [opened, setOpened] = useState(true);

	const startParentHandshake = async () => {
		if (parent) return; // parent connects only once
		try {
			const parentHandshake = new Postmate.Model({
				open: async userProps => {
					let compatProps = ApiCompat.normalizeLegacyApi(userProps);
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
