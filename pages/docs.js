import ReactMarkdown from 'react-markdown';

const content = `
## Publish Widget

Boost POW Publish is a simple way to Boost content on your website. It is a reference publisher implementation to Boost content.

Currently supported wallets are Money Button and RelayX.

The simplest Boost POW Publish usage looks like this:
\`\`\`
// in HTML
<script src="https://publish.boostpow.com/publish.js"></script>

// in javascript
boostPublish.open({
	// content: 'optional content to initialize',
	// content: '4d0295d207f3a00d73f069fc4aa5e06d3fe98d565af9f38983c0d486d6166a09', // txid
	/* outputs: [
		{
			to: "18YCy8VDYcXGnekHC4g3vphnJveTskhCLf", amount: 0.0004, currency: 'BSV'
		}
	],*/
	// tag: 'bitcoin',
	// category: 'B',  // defaults to 'B' underneath.
	// showTagField: true, // defaults to true
	// showCategoryField: false, // defaults to false
	// diffMultiplier: 0.00002, // defaults to 0.00002
	// displayMessage: 'Boost this', // set to empty string to disable
	onPayment: function(payment, boostJobStatus) {
		console.log(payment, boostJobStatus);
	}
});
\`\`\`

## The boostPublish object

Including the Boost POW Publisher embed on your makes \`boostPublish\` available on the browser's \`window\` object.
It has one asynchronous method, \`open\` that resolves with
a payment object upon a successful payment and throws if there was an error.
\`open\` returns \`undefined\` if the payment was canceled.

## Available options:

### content

Optional content to initialize with. Leave empty to allow user to set it.

### tag

Optional tag to initialize with. Leave empty to allow user to set it.

### outputs

An array containing a list of output ojects. Each output object may have the following properties:

- \`to\`: (string) - bitcoin address
- \`amount\`: (number) - amount of bitcoin (BSV)
- \`script\`: (string) - valid bitcoin script using ASM format

### Category

Optional category to initialize with. Leave empty to default to 'B'

### showCategoryField

Optional showCategoryField whether to show category field or not.

### showTagField

Optional showTagField whether to show tag field or not.

### diffMultiplier

Optional diffMultiplier to set how much to charge per difficulty unit. Default: 0.00002

### displayMessage

Optional displayMessage to show user. Defaults to 'What's Boost?' text if not set.

### onPayment

A function that is called after a successful payment

### onError

A function that is called when an error occurs during the payment

### moneybuttonProps

Additional properties passed into moneybutton.

### relayxProps

Additional propeties passed into relayx
`;

const Docs = () => {
	return (
		<div style={{ width: '100vw' }}>

			<div style={{ maxWidth: '100%', margin: '0 auto', width: '600px' }}>
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
