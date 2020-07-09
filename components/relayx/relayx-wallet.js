const RELAYX_ELEM_ID = 'relayx-button';

export const getRelayxElem = () => {
	return document.getElementById(RELAYX_ELEM_ID);
};

export const prepareRelayxProps = props => {
	if (!props.outputs || !props.outputs.length) {
		return false;
	}

	const outputs = props.outputs.map(each => ({
		currency: 'BSV',
		...each
	}));

	if (!outputs || !outputs.length) {
		return false;
	}

	const walletProps = {
		...props,
		...props.relayxProps,
		outputs
	};

	delete walletProps.moneybuttonProps;
	delete walletProps.parent;
	
	return walletProps;
};

export const renderRelayx = walletProps => {
	if (!window.relayone) return false;
	window.relayone.render(getRelayxElem(), {
		...walletProps,
		onPayment: payment => {
			return walletProps.onPayment({ txid: payment.txid, rawtx: payment.rawTx });
		}
	});
	return true;
};
