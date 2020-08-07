import ReactMarkdown from 'react-markdown';

const content = `
# Publish Widget

Boost POW Publish is a simple way to Boost content on your website. It is a reference publisher implementation to Boost content.

Currently supported wallets are Money Button and RelayX.

## Simple usage

The simplest Boost POW Publish usage looks like this:
\`\`\`
// in HTML
<script src="https://publish.boostpow.com/publish.js"></script>

// in javascript
boostPublish.open({
	content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09',
	onPayment: function(payment) {
		console.log(payment);
	}
});
\`\`\`

[See our DEMO page for more examples of the BoostPOW Publish widget configuration](https://publish.boostpow.com/demo.html "Demo Page")

# The boostPublish object

Including the Boost POW Publisher embed on your page, makes \`boostPublish\` available on the browser's \`window\` object.
It has one asynchronous method, \`open\` that resolves with a payment object upon a successful payment and throws if there was an error.
\`open\` returns \`undefined\` if the payment was canceled.


## Complete configuration options

The complete Boost POW Publish configuration options object looks like this:

\`\`\`
// in HTML
<script src="https://publish.boostpow.com/publish.js"></script>

// in javascript
boostPublish.open({
	message: 'Your message!',
	content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09',
	showContent: true,
	tag: '$your-tag',
	showTag: true,
	category: 'B',
	showCategory: true,
	boostRank: {
		hours: 24,
		tags: [],
		categories: []
	},
	diff: {
		min: 1,
		max: 40,
		initial: 1,
		multiplier: 0.00002,
		disabled: false,
		showInput: false
	},
	slider: {
		sliderStep: 1,
		markerStep: 10,
		maxMarkers: 15,
		rankMarkers: []
	},
	wallets: ['moneybutton','relayx'],
	initialWallet: 'moneybutton',
	outputs: [
		{
			to: "18YCy8VDYcXGnekHC4g3vphnJveTskhCLf", 
			amount: 0.0004, 
			currency: 'BSV'
		}
	],
	onPayment: function(payment) {
		console.log(payment);
	},
	onError: function(error) {
		console.log(error);
	},
	moneybuttonProps: {
		onCryptoOperations: (cryptoOperationsCallback) => {},
		// Additional moneybutton options to be passed to the button
	},
	relayxProps: {
		// Additional relayX options to be passed to the button
	}

});
\`\`\`

There are some different ways you can use each property, as we will see below.

There are no required options.

# Available options
___

## Message Options
#### message: string;
Optional text message to show to the user at the top of the widget. Defaults to 'What's Boost?' text if not set.
___

## Content Options
#### content: string;
Optional content hash string to initialize with. Leave empty to allow user to set it.

#### showContent: boolean;
Optionally show/hide the content field. Defaults to true.

#### content: object;
The content property can also be used as an object like:
\`\`\`
content: {
	hash: '', // content tx hash
	show: true
}

// undefined properties will be initialized with default values
\`\`\`

___

## Tag Options
#### tag: string;
Optional tag to initialize with. Leave empty to allow user to set it.
#### showTag: boolean;
Optional showTag whether to show tag field or not.

#### tag: object;
The tag property can also be used as an object like:
\`\`\`
tag: {
	value: '',
	show: true,
	disabled: false // when true, disables tag input field
}

// undefined properties will be initialized with default values
\`\`\`

___

## Category Options
#### category: string;
Optional category to initialize with. Leave empty to default to 'B'

#### showCategory: boolean;
Optional showCategory whether to show category field or not.

#### category: object;
The category property can also be used as an object like:
\`\`\`
category: {
	value: '',
	show: true,
	disabled: false // when true, disables category input field
}

// undefined properties will be initialized with default values
\`\`\`
___

## Boost Rank Options

#### boostRank: object;
The boostRank property can be configured as the object below:
\`\`\`
boostRank: {
	hours: 24,
	tags: [], // filters the boostpow api with one or many tags
	category: '' // filters the boostpow api with one category
}

// undefined properties will be initialized with default values
\`\`\`

#### boostRank: boolean;
Optional defaults to true. When boostRank is true, returns the same configurations showed on boostRank object above.

#### rankHours: number;
Another way to set the total number of hours to return boosts ranks. Defaults to 24 hours.
___

## Difficulty Options

#### diff: object;
The diff property can be configured as the object below:
\`\`\`
diff: {
	min: number;,
	max: undefined,
	initial: undefined,
	multiplier: 0.00002,
	disabled: false,
	showInput: false,
}

// undefined properties will be initialized with default values
\`\`\`

#### minDiff: number;
Another way to set the minimal difficulty value. Default: 1

#### maxDiff: number;
Another way to set the maximal difficulty value. Default: 40

#### diffMultiplier: number;
Another way to set how much to charge per difficulty unit. Default: 0.00002

#### initialDiff: number;
Another way to set the initial difficulty value. Default: 1

#### lockDiff: boolean;
Another way to disable changes on the difficulty field. Defaults to false.

#### showInputDiff: boolean;
Another way to set whether to show difficulty input field or not. Defaults to false.

___

## Slider Options
#### slider: object;
The slider property can be configured as the object below:
\`\`\`
slider: {
	sliderStep: 1,
	markerStep: 10,
	maxMarkers: 15,
	rankMarkers: []	// an array of the TOP ranks number you want to show on the markers bar
}

// undefined properties will be initialized with default values
\`\`\`

#### slider: boolean;
Optional defaults to true. When slider is true, returns the same configurations showed on slider object above.
If slider is false, hides the slider component.

#### showSliderDiff: boolean;
Another way to set whether to show difficulty slider field or not. Default: true

#### sliderDiffStep: number;
Another way to set the total amount of difficulty that will be changed in each slider step. Default 1

#### sliderDiffMarkerStep: number;
Another way to set the interval between each slider marker steps to be shown on difficulty slider bar. Default: 10

#### sliderMarkersMaxCount: number;
Another way to set the maximum number of markers allowed to show in slider bar. Default: 15

___

## Wallet Options

#### wallets: object;
The wallets property can be configured as the object below:
\`\`\`
wallets: {
	available: ['moneybutton', 'relayx'],
	initial: 'moneybutton'
}

// undefined properties will be initialized with default values
\`\`\`

#### wallets: array\\[string\\];
A an array of wallet ids that the user wants available as payment options.
Currently supports only 'moneybutton' and 'relayx' options.
Defaults to the same configuration object showed on wallets object above.

#### initialWallet: string;
Another way to set the wallet id to initialize with. Leave empty to start with moneybutton.
___

## Outputs Option
#### outputs
An array containing a list of output ojects. Each output object may have the following properties:

- \`to\`: (string) - bitcoin address
- \`amount\`: (number) - amount of bitcoin (BSV)
- \`script\`: (string) - valid bitcoin script using ASM format

Example: 
\`\`\`
outputs: [
	{
		to: "18YCy8VDYcXGnekHC4g3vphnJveTskhCLf", 
		amount: 0.0004, 
		currency: 'BSV'
	}
]
\`\`\`
___

## Events and Callback Options
#### onPayment: function;
A function that is called after a successful payment

#### onError: function;
A function that is called when an error occurs during the payment

#### moneybuttonProps: object;
Additional properties passed into moneybutton.

#### relayxProps: object;
Additional propeties passed into relayx button.
`;

const Docs = () => {
	return (
		<div style={{ width: '100vw' }}>

			<div style={{ maxWidth: '100%', margin: '0 auto', width: '800px' }}>
				<a href="https://boostpow.com">
					<img src="/logo.svg" style={{ marginTop: '1em' }}/>
				</a>
				<ReactMarkdown source={content} />
			</div>

			<style jsx global>{`
				html,
				body {
					min-height: 100%;
					padding: 0;
					margin: 0;
					font-family: proxima-nova, Helvetica;
				}

				code {
					background: #dedede;
					line-height: 18px;
					padding: 0 4px;
					border-radius: 6px;
				}

				pre {
					border-radius: 6px;
					background: #dedede;
					padding: 12px;
				}

				* {
					box-sizing: border-box;
				}
			`}</style>
		</div>
	);
};

export default Docs;
