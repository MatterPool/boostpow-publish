!function e(t,n,i){function r(a,s){if(!n[a]){if(!t[a]){var d="function"==typeof require&&require;if(!s&&d)return d(a,!0);if(o)return o(a,!0);var c=new Error("Cannot find module '"+a+"'");throw c.code="MODULE_NOT_FOUND",c}var l=n[a]={exports:{}};t[a][0].call(l.exports,(function(e){return r(t[a][1][e]||e)}),l,l.exports,e,t,n,i)}return n[a].exports}for(var o="function"==typeof require&&require,a=0;a<i.length;a++)r(i[a]);return r}({1:[function(e,t,n){function i(e,t,n){e.style.width=t||"100vw",e.style.height=n||"100%"}t.exports={sleep:function(e){return new Promise(t=>setTimeout(t,e))},addStyle:function(e,t){var n=document.createElement("style");return n.type="text/css",n.innerHTML=e,document.getElementsByTagName(t)[0].appendChild(n),n},setElemSize:i,hideElem:function(e){i(e,"0px","0px")},displayElem:function(e){i(e,"100vw","100%")},hasStrLen:function(e,t){return"string"==typeof e&&e.length>=t},isStrictBool:function(e){return[!0,!1].indexOf(e)>-1},isUndef:function(e){return[void 0,null].indexOf(e)>-1},hasObjProp:function(e,t){return"object"==typeof e&&!Array.isArray(e)&&(void 0===t||void 0!==e[t])},dynamicSort:function(e,t){return t=t<0?-1:1,function(n,i){return(n[e]<i[e]?-1:n[e]>i[e]?1:0)*t}}}},{}],2:[function(e,t,n){(function(e){var n="application/x-postmate-v1+json",i=0,r=function(){var e;return c.debug?(e=console).log.apply(e,arguments):null},o={handshake:1,"handshake-reply":1,call:1,emit:1,reply:1,request:1},a=function(e,t){return("string"!=typeof t||e.origin===t)&&(!!e.data&&(("object"!=typeof e.data||"postmate"in e.data)&&(e.data.type===n&&!!o[e.data.postmate])))},s=function(){function t(t){var n=this;this.parent=t.parent,this.frame=t.frame,this.child=t.child,this.childOrigin=t.childOrigin,this.events={},"production"!==e.env.NODE_ENV&&(r("Parent: Registering API"),r("Parent: Awaiting messages...")),this.listener=function(t){if(!a(t,n.childOrigin))return!1;var i=((t||{}).data||{}).value||{},o=i.data,s=i.name;"emit"===t.data.postmate&&("production"!==e.env.NODE_ENV&&r("Parent: Received event emission: "+s),s in n.events&&n.events[s].call(n,o))},this.parent.addEventListener("message",this.listener,!1),"production"!==e.env.NODE_ENV&&r("Parent: Awaiting event emissions from Child")}var o=t.prototype;return o.get=function(e){var t=this;return new c.Promise((function(r){var o=++i;t.parent.addEventListener("message",(function e(n){n.data.uid===o&&"reply"===n.data.postmate&&(t.parent.removeEventListener("message",e,!1),r(n.data.value))}),!1),t.child.postMessage({postmate:"request",type:n,property:e,uid:o},t.childOrigin)}))},o.call=function(e,t){this.child.postMessage({postmate:"call",type:n,property:e,data:t},this.childOrigin)},o.on=function(e,t){this.events[e]=t},o.destroy=function(){"production"!==e.env.NODE_ENV&&r("Parent: Destroying Postmate instance"),window.removeEventListener("message",this.listener,!1),this.frame.parentNode.removeChild(this.frame)},t}(),d=function(){function t(t){var i=this;this.model=t.model,this.parent=t.parent,this.parentOrigin=t.parentOrigin,this.child=t.child,"production"!==e.env.NODE_ENV&&(r("Child: Registering API"),r("Child: Awaiting messages...")),this.child.addEventListener("message",(function(t){if(a(t,i.parentOrigin)){"production"!==e.env.NODE_ENV&&r("Child: Received request",t.data);var o=t.data,s=o.property,d=o.uid,l=o.data;"call"!==t.data.postmate?function(e,t){var n="function"==typeof e[t]?e[t]():e[t];return c.Promise.resolve(n)}(i.model,s).then((function(e){return t.source.postMessage({property:s,postmate:"reply",type:n,uid:d,value:e},t.origin)})):s in i.model&&"function"==typeof i.model[s]&&i.model[s](l)}}))}return t.prototype.emit=function(t,i){"production"!==e.env.NODE_ENV&&r('Child: Emitting Event "'+t+'"',i),this.parent.postMessage({postmate:"emit",type:n,value:{name:t,data:i}},this.parentOrigin)},t}(),c=function(){function t(e){var t=e.container,n=void 0===t?void 0!==n?n:document.body:t,i=e.model,r=e.url,o=e.name,a=e.classListArray,s=void 0===a?[]:a;return this.parent=window,this.frame=document.createElement("iframe"),this.frame.name=o||"",this.frame.classList.add.apply(this.frame.classList,s),n.appendChild(this.frame),this.child=this.frame.contentWindow||this.frame.contentDocument.parentWindow,this.model=i||{},this.sendHandshake(r)}return t.prototype.sendHandshake=function(i){var o,d=this,c=function(e){var t=document.createElement("a");t.href=e;var n=t.protocol.length>4?t.protocol:window.location.protocol,i=t.host.length?"80"===t.port||"443"===t.port?t.hostname:t.host:window.location.host;return t.origin||n+"//"+i}(i),l=0;return new t.Promise((function(t,u){d.parent.addEventListener("message",(function n(i){return!!a(i,c)&&("handshake-reply"===i.data.postmate?(clearInterval(o),"production"!==e.env.NODE_ENV&&r("Parent: Received handshake reply from Child"),d.parent.removeEventListener("message",n,!1),d.childOrigin=i.origin,"production"!==e.env.NODE_ENV&&r("Parent: Saving Child origin",d.childOrigin),t(new s(d))):("production"!==e.env.NODE_ENV&&r("Parent: Invalid handshake reply"),u("Failed handshake")))}),!1);var h=function(){l++,"production"!==e.env.NODE_ENV&&r("Parent: Sending handshake attempt "+l,{childOrigin:c}),d.child.postMessage({postmate:"handshake",type:n,model:d.model},c),5===l&&clearInterval(o)},p=function(){h(),o=setInterval(h,500)};d.frame.attachEvent?d.frame.attachEvent("onload",p):d.frame.onload=p,"production"!==e.env.NODE_ENV&&r("Parent: Loading frame",{url:i}),d.frame.src=i}))},t}();c.debug=!1,c.Promise=function(){try{return window?window.Promise:Promise}catch(e){return null}}(),c.Model=function(){function t(e){return this.child=window,this.model=e,this.parent=this.child.parent,this.sendHandshakeReply()}return t.prototype.sendHandshakeReply=function(){var t=this;return new c.Promise((function(i,o){t.child.addEventListener("message",(function a(s){if(s.data.postmate){if("handshake"===s.data.postmate){"production"!==e.env.NODE_ENV&&r("Child: Received handshake from Parent"),t.child.removeEventListener("message",a,!1),"production"!==e.env.NODE_ENV&&r("Child: Sending handshake reply to Parent"),s.source.postMessage({postmate:"handshake-reply",type:n},s.origin),t.parentOrigin=s.origin;var c=s.data.model;return c&&(Object.keys(c).forEach((function(e){t.model[e]=c[e]})),"production"!==e.env.NODE_ENV&&r("Child: Inherited and extended model from Parent")),"production"!==e.env.NODE_ENV&&r("Child: Saving Parent origin",t.parentOrigin),i(new d(t))}return o("Handshake Reply Failed")}}),!1)}))},t}(),t.exports=c}).call(this,e("_process"))},{_process:3}],3:[function(e,t,n){var i,r,o=t.exports={};function a(){throw new Error("setTimeout has not been defined")}function s(){throw new Error("clearTimeout has not been defined")}function d(e){if(i===setTimeout)return setTimeout(e,0);if((i===a||!i)&&setTimeout)return i=setTimeout,setTimeout(e,0);try{return i(e,0)}catch(t){try{return i.call(null,e,0)}catch(t){return i.call(this,e,0)}}}!function(){try{i="function"==typeof setTimeout?setTimeout:a}catch(e){i=a}try{r="function"==typeof clearTimeout?clearTimeout:s}catch(e){r=s}}();var c,l=[],u=!1,h=-1;function p(){u&&c&&(u=!1,c.length?l=c.concat(l):h=-1,l.length&&m())}function m(){if(!u){var e=d(p);u=!0;for(var t=l.length;t;){for(c=l,l=[];++h<t;)c&&c[h].run();h=-1,t=l.length}c=null,u=!1,function(e){if(r===clearTimeout)return clearTimeout(e);if((r===s||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(e);try{r(e)}catch(t){try{return r.call(null,e)}catch(t){return r.call(this,e)}}}(e)}}function f(e,t){this.fun=e,this.array=t}function v(){}o.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];l.push(new f(e,t)),1!==l.length||u||d(m)},f.prototype.run=function(){this.fun.apply(null,this.array)},o.title="browser",o.browser=!0,o.env={},o.argv=[],o.version="",o.versions={},o.on=v,o.addListener=v,o.once=v,o.off=v,o.removeListener=v,o.removeAllListeners=v,o.emit=v,o.prependListener=v,o.prependOnceListener=v,o.listeners=function(e){return[]},o.binding=function(e){throw new Error("process.binding is not supported")},o.cwd=function(){return"/"},o.chdir=function(e){throw new Error("process.chdir is not supported")},o.umask=function(){return 0}},{}],4:[function(e,t,n){const i=e("postmate"),r=e("../lib/helpers");const o=new class{async init(){console.log("BoostPOW Publish 1.1.3 initialized."),r.addStyle(".boostPublishFrame {\n\t\t\t\tborder: none;\n\t\t\t\toverflow: hidden;\n\t\t\t\twidth: 0px;\n\t\t\t\theight: 0px;\n\t\t\t\tposition: fixed;\n\t\t\t\tbottom: 0;\n\t\t\t\tleft: 0;\n\t\t\t}","head"),this.child=await new i({name:"boostpow-publish",container:document.body,url:"https://publish.boostpow.com",classListArray:["boostPublishFrame"],model:{fromPowPublish:!0}}),this.iframe=this.child.frame,this.didInit=!0}displayIframe(){r.displayElem(this.iframe)}hideIframe(){r.hideElem(this.iframe)}async open(e){if(!this.didInit)return await r.sleep(200),void this.open(e);let t,n,i;e.moneybuttonProps&&e.moneybuttonProps.onCryptoOperations&&(t=e.moneybuttonProps.onCryptoOperations,delete e.moneybuttonProps.onCryptoOperations),e.onPayment&&(i=e.onPayment,delete e.onPayment),e.onError&&(n=e.onError,delete e.onError),this.child.call("open",e),this.displayIframe();const o=this;return new Promise((e,r)=>{o.child.on("opened",e=>{o.child.call("opened",e)}),o.child.on("close",()=>(o.child.call("close"),o.hideIframe(),e())),o.child.on("payment",({payment:t})=>(o.hideIframe(),i&&i(t),e(t))),o.child.on("error",({error:e})=>(o.hideIframe(),n&&n(e),r(e))),o.child.on("cryptoOperations",({cryptoOperations:e})=>(o.hideIframe(),t&&t(e)))})}};t.exports=o},{"../lib/helpers":1,postmate:2}],5:[function(e,t,n){const i=e("./boostpow-publish");window.addEventListener("load",(function(){i.init()})),window.boostPublish=i},{"./boostpow-publish":4}]},{},[5]);