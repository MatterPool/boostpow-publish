let ReactMoneyButton = require('@moneybutton/react-money-button').default;

const MoneyButton = props => {
	const outputs = props.outputs.map(each => ({
		currency: 'BSV',
		...each
	}));
	// console.log('MoneyButton render', props, outputs);

	const showWallet = () => {
		return ['moneybutton', undefined].indexOf(props.currentWallet) > -1;
	};

	return (
		<div>
			{ showWallet() && 
				<ReactMoneyButton
					{...props}
					{...props.moneybuttonProps}
					outputs={outputs}
					onPayment={payment => {
						if (payment.cryptoOperations) {
							props.moneybuttonProps.onCryptoOperations(payment.cryptoOperations);
						}

						return props.onPayment({ txid: payment.txid, rawtx: payment.rawtx });
					}}
				/>
			}
		</div>

	);
};

export default MoneyButton;
