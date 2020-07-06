import Head from 'next/head';
import PaymentPopup from '../components/payment-popup';
import { useEffect, useState } from 'react';
import Postmate from 'postmate';

const Home = () => {
	const [paymentProps, setPaymentProps] = useState({
		wallets: ['moneybutton', 'relayx'],
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
		// tag: '$',
		// showTagField: false, // defaults to true
		// showCategoryField: false, // defaults to false
		// showInputDiff: false, // defaults to true
		// diffMultiplier: 0.00002, // defaults to 0.00002
		// displayMessage: 'hello world',
	});
	const [parent, setParent] = useState();
	const listenForPay = async () => {

		try {
			const p = await new Postmate.Model({
				open: ({ props }) => {
					setPaymentProps({ ...paymentProps, ...props });
				}
			});
			p.emit('init', true);
			setParent(p);
		} catch (e) {
			const p = await new Postmate.Model({
				open: ({ props }) => {
					setPaymentProps({ ...paymentProps, ...props });
				}
			});
			p.emit('init', true);
			setParent(p);
		}
	};

	useEffect(() => {
		listenForPay();
	});

	return (
		<div className="container">
			<Head>
				<title>Boost POW Publisher</title>
				<link rel="icon" href="/favicon.png" />
				<link rel="stylesheet" href="https://use.typekit.net/kwm6mcp.css" />
			</Head>
			<main>
				<PaymentPopup {...paymentProps} parent={parent} />
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
