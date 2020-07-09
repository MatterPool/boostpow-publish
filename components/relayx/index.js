import Script from 'react-load-script';
import * as RelayxWallet from './relayx-wallet'
import { useEffect } from 'react';

const RelayX = props => {

	let isFirstLoad = false;

	const renderRelayx = () => {
		const walletProps = RelayxWallet.prepareRelayxProps(props);
		if (!walletProps) return (<div>No outputs</div>);
		RelayxWallet.renderRelayx(walletProps);
	};

	// When component first loads, load the relayone script and render the wallet on load
	const handleLoad = () => {
		renderRelayx();
		isFirstLoad = true;
	};

	// This will render the wallet everytime the wallet props changes after the first load
	useEffect(() => {
		if (!isFirstLoad){
			renderRelayx();
		}
	});

	return (
		<>
			<Script url="https://one.relayx.io/relayone.js" onLoad={handleLoad} />
			<div id="relayx-button" style={{ height: '43px' }} />
		</>
	);
};

export default RelayX;
