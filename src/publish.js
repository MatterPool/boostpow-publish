const boostPublish = require('./boostpow-publish');
window.addEventListener('load', function() {
	boostPublish.init();
});
window.boostPublish = boostPublish;
