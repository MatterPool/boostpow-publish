export const VALID_WALLETS = ['moneybutton', 'relayx'];
export const DEFAULT_WALLET = 'moneybutton';

// Returns true if wallet ID is a valid wallet
export const isValidWallet = wKey => {
	return VALID_WALLETS.indexOf(wKey) > -1;
};

// Receives a wallet id and returns it, if valid, or default wallet id if not valid
export const getValidWallet = wKey => {
	return isValidWallet(wKey) ? wKey : DEFAULT_WALLET;
};

// Receives a wallets ids arrays, and return only valid wallets ids, of default wallets if no valid ids found
export const filterValidWallets = wallets => {
	if (!Array.isArray(wallets) || wallets.length == 0) return VALID_WALLETS;
	const filtered = wallets.filter(w => isValidWallet(w));
	return filtered.length > 0 ? filtered : VALID_WALLETS;
};
