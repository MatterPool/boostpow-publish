// Lib entry file, exported to /public folder on publish
const boostPublish = require('./boostpow-publish');
window.addEventListener('load', function() {
	boostPublish.init();
});
window.boostPublish = boostPublish;
