// Helpers and utilities

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function addStyle(cssCode, targetTagName) {
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = cssCode;
	document.getElementsByTagName(targetTagName)[0].appendChild(style);
	return style;
}

function setElemSize(el, w, h) {
	el.style.width = w || '100vw';
	el.style.height = h || '100%';
}

function hideElem(el) {
	setElemSize(el, '0px', '0px');
}

function displayElem(el) {
	setElemSize(el, '100vw', '100%');
}

module.exports = {
	sleep: sleep,
	addStyle: addStyle,
	setElemSize: setElemSize,
	hideElem: hideElem,
	displayElem: displayElem
};