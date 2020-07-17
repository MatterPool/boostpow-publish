// BoostPublish API Class
const Postmate = require('postmate');
const Helpers = require('../lib/helpers');

class BoostPublish {
	// Initializes the widget after page load
	async init() {
		// console.log("BPow Initializing...")
		Helpers.addStyle(
			`.boostPublishFrame {
				border: none;
				overflow: hidden;
				width: 0px;
				height: 0px;
				position: fixed;
				bottom: 0;
				left: 0;
			}`,
			'head'
		);

		// Postmate iframe wrapper
		this.child = await new Postmate({
			name: 'boostpow-publish',
			container: document.body,
			url: 'https://publish.boostpow.com', // 'http://localhost:4000', 
			classListArray: ['boostPublishFrame'],
			model: { fromPowPublish: true }
		});

		// direct link to the iframe
		this.iframe = this.child.frame;
		this.didInit = true;
		// console.log("BPow Initialized!")
	}

	displayIframe() {
		Helpers.displayElem(this.iframe);
	}

	hideIframe() {
		Helpers.hideElem(this.iframe);
	}

	// Opens the widget using the props configuration object
	async open(props) {
		// console.log('BoostPublish open', props);

		// If trying to open before init, keep trying each 200 miliseconds until the widget initializes
		if (!this.didInit) {
			await Helpers.sleep(200);
			this.open(props);
			return;
		}

		// Prepares callbacks
		let onCryptoOperations;
		let onError;
		let onPayment;

		if (props.moneybuttonProps && props.moneybuttonProps.onCryptoOperations) {
			onCryptoOperations = props.moneybuttonProps.onCryptoOperations;
			delete props.moneybuttonProps.onCryptoOperations;
		}

		if (props.onPayment) {
			onPayment = props.onPayment;
			delete props.onPayment;
		}

		if (props.onError) {
			onError = props.onError;
			delete props.onError;
		}

		this.child.call('open', props);
		this.displayIframe();

		const self = this;
		return new Promise((resolve, reject) => {
			self.child.on('opened', props => {
				self.child.call('opened', props);
			});
			self.child.on('close', () => {
				self.hideIframe();
				return resolve();
			});
			self.child.on('payment', ({ payment }) => {
				self.hideIframe();
				onPayment && onPayment(payment);
				return resolve(payment);
			});
			self.child.on('error', ({ error }) => {
				self.hideIframe();
				onError && onError(error);
				return reject(error);
			});
			self.child.on('cryptoOperations', ({ cryptoOperations }) => {
				self.hideIframe();
				return onCryptoOperations && onCryptoOperations(cryptoOperations);
			});
		});
	}
}

const boostPublish = new BoostPublish();
module.exports = boostPublish;
