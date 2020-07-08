import Script from 'react-load-script';
import * as RelayxWallet from './relayx-wallet'

const RelayX = props => {

	const handleLoad = () => {
		const walletProps = RelayxWallet.prepareRelayxProps(props);
		if (!walletProps) return (<div>No outputs</div>);
		// console.log("RelayX walletProps before render", walletProps);
		RelayxWallet.renderRelayx(walletProps);
	};

	return (
		<>
			<Script url="https://one.relayx.io/relayone.js" onLoad={handleLoad} />
			<div id="relayx-button" style={{ height: '43px' }} />
		</>
	);
};

export default RelayX;
