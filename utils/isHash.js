function isHash(value) {
	return typeof(value) === 'string' && value.length == 64 && /^[a-f0-9]+$/.test(value);
}

export default isHash;
