import MoneyButton from '../moneybutton';
import RelayX from '../relayx';
import ProxyPay from '../proxypay';
import MenuItem from '@material-ui/core/MenuItem';

// Available wallets configurations
const WALLETS = {
	moneybutton: {
		name: 'Money Button',
		Element: MoneyButton
	},
	relayx: {
		name: 'RelayX',
		Element: RelayX
	},
	proxypay: {
		name: 'Scan QR',
		Element: ProxyPay
	}
};

// Return a wallet configuration by wallet key
export const getWallet = wKey => {
	return WALLETS[wKey];
};

// Return a wallet Element by wallet key
export const getWalletElem = wKey => {
	return getWallet(wKey).Element;
};

const renderMenuItem = wKey => (
	<MenuItem
		classes={{
			root: 'boost-publisher-menu-item',
			selected: 'boost-publisher-menu-item-selected'
		}}
		value={wKey}
		key={wKey}
	>
		{WALLETS[wKey].name}
	</MenuItem>
);

export const renderWalletMenuItems = propsWallets => {
	return Object.keys(WALLETS)
		.filter(wKey => propsWallets.find(w => w === wKey))
		.map(wKey => renderMenuItem(wKey));
};
