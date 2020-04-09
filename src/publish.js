const boostPublisher = require('./boostpow-publish');
window.addEventListener('load', function() {
	boostPublisher.init();
});
window.boostPublisher = boostPublisher;
