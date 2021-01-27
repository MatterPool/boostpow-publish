import snarkdown from 'snarkdown';

async function fetchContentPreview(newContent) {
	let resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`, { method: 'HEAD' });

	if (resp.status === 404) {
		return { value: newContent, message: 'NOT_FOUND' };
	}

	let type = resp.headers.get('Content-Type');
	let preview;

	if (type.match(/^text/)) {
		resp = await fetch(`https://media.bitcoinfiles.org/${newContent}`);
		let text = await resp.text();
		if (type === 'text/markdown; charset=utf-8') {
			preview = snarkdown(text);
		} else {
			preview = text;
		}
	}

	return { value: newContent, type, preview };
}

export default fetchContentPreview;
