
# Boost POW Publish Widget

> Boost Proof of Work Protocol
> https://boostpow.com

Boost POW Publish is a simple way to Boost content on your website. The widget enables developers to interact with Boost POW implementation directly from their websites, making it easy to create Boost POW jobs attached to onchain contents, and allowing users to boost their energy in a few simple steps.

Currently supported wallets are Money Button and RelayX.

## Installation
Put this script on your page.
```
<script src="https://publish.boostpow.com/publish.js" defer>
```
## Usage
After page loads the boostPublish object will be available for access from your script.
```
// Opens the widget with a simple text content as example
const response = await boostPublish.open({
	content: '2829b4df5152fb867128f0ea2cffdfe3b7134a98b356eb1a1813b68fd3b83519',
	onPayment: (payment, boostJob) => {
		console.log(payment, boostJob);
	}
});
```
<a href='https://publish.boostpow.com/docs'>See our DOCS page for complete reference to the BoostPOW Publish widget configuration</a>
<a href='https://publish.boostpow.com/demo.html'>See our DEMO page for more examples of the BoostPOW Publish widget configuration</a>

## More about Boost POW protocol and tools

**Links**:
- <a href='https://boostpow.com'>Boost POW Official Website</a>
- <a href='https://github.com/matterpool/boostpow-js'>Javascript SDK: boostpow-js</a>
- <a href='https://github.com/matterpool/boostpow-api'>Standalone API Server: boostpow-api</a>
- <a href='https://media.bitcoinfiles.org/52fb4bedc85854638af61a7f906bf8e93da847d2ddb522b1aec53cfc6a0b2023'>BoostPOW Whitepaper markdown</a>

## Contributing
Clone this project and run:
```
    npm install
```

Run the project in development mode
```
    npm run dev
```

Build the project
```
    npm run build
    npm run export
    npm run build-browser-partial
    npm run build-browser-full
```