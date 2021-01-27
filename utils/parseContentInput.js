import isHash from 'app-utils/isHash';

function parseContentInput(inputValue) {
	if (typeof inputValue !== 'string' || inputValue.length === 0) {
		return undefined;
	}

	if (inputValue.startsWith('https://bitcoinfiles.org/t/')) {
		let hash = inputValue
			.slice(27)
			.slice(0, 64)
			.toLowerCase();
		if (isHash(hash)) return hash;
	}

	if (inputValue.startsWith('https://bitcoinfiles.org/tx/')) {
		let hash = inputValue
			.slice(28)
			.slice(0, 64)
			.toLowerCase();
		if (isHash(hash)) return hash;
	}

	if (inputValue.startsWith('https://twetch.app/t/')) {
		let hash = inputValue
			.slice(21)
			.slice(0, 64)
			.toLowerCase();
		if (isHash(hash)) return hash;
	}

	let hash = inputValue.trim().toLowerCase();
	if (isHash(hash)) return hash;

	if (inputValue.length <= 32) {
		return inputValue;
	}

	return undefined;
}

export default parseContentInput;
