//SocketConsole.js

(function(){"use strict";function l(e){a.lastIndex=0;return a.test(e)?'"'+e.replace(a,function(e){var t=f[e];return typeof t==="string"?t:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+e+'"'}function c(e,t,i,s){var o,u,a,f,h,p=t[e];if(p&&typeof p==="object"&&typeof p.toPrunedJSON==="function"){p=p.toPrunedJSON(e)}switch(typeof p){case"string":return l(p);case"number":return isFinite(p)?String(p):"null";case"boolean":case"null":return String(p);case"object":if(!p){return"null"}if(i<=0||n.indexOf(p)!==-1){return'"-pruned-"'}n.push(p);h=[];if(Object.prototype.toString.apply(p)==="[object Array]"){f=Math.min(p.length,s);for(o=0;o<f;o+=1){h[o]=c(o,p,i-1,s)||"null"}return"["+h.join(",")+"]"}r(p,function(e){try{a=c(e,p,i-1,s);if(a)h.push(l(e)+":"+a)}catch(t){}});return"{"+h.join(",")+"}"}}var e=3;var t=50;var n;var r;var i=function(e,t){for(var n in e){if(Object.prototype.hasOwnProperty.call(e,n))t(n)}};var s=function(e,t){for(var n in e)t(n)};var o=function(e,t,n){if(e==null)return;n=n||{};Object.getOwnPropertyNames(e).forEach(function(e){if(!n[e]){t(e);n[e]=true}});o(Object.getPrototypeOf(e),t,n)};Date.prototype.toPrunedJSON=Date.prototype.toJSON;String.prototype.toPrunedJSON=String.prototype.toJSON;var u=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,a=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,f={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};JSON.prune=function(u,a,f){if(typeof a=="object"){var l=a;a=l.depthDecr;f=l.arrayMaxLength;r=l.iterator||i;if(l.allProperties)r=o;else if(l.inheritedProperties)r=s}else{r=i}n=[];a=a||e;f=f||t;return c("",{"":u},a,f)};JSON.prune.log=function(){console.log.apply(console,Array.prototype.slice.call(arguments).map(function(e){return JSON.parse(JSON.prune(e))}))};JSON.prune.forEachProperty=o})()

var SocketConsole = function(socketIOAddr, overrides) {
    /** Internalise arguments */
    this.__socketIOAddr = socketIOAddr;
    this.__overrides = overrides;

    /** Only replace the console if we can connect to the socket server */
    this._startSocket(socketIOAddr);
};

SocketConsole.prototype._stringify = JSON.prune;

SocketConsole.prototype._replaceConsole = function() {
    var scope = this;

    if (this._hasOverrides)
        return false;

    console.info("SocketConsole: attempting to hijack the console");

    this.__overrides.forEach(function (override) {
        var func = window.console[override];

        window.console[override] = function () {
            func.apply(console, arguments);
            scope._emit(override, scope._stringify(arguments));
        };
    });

    var winOnError = window.onerror;

    window.onerror = function () {
        if (winOnError)
            winOnError.apply(window, arguments);

        scope._emit("window.onerror", scope._stringify(arguments));

        return false;
    };

    this._hasOverrides = true;
};

SocketConsole.prototype._startSocket = function(socketIOAddr) {
    this._socket = io(socketIOAddr);
    this._socket.on('connect', this._replaceConsole.bind(this));
};

SocketConsole.prototype._emit = function(type, msg) {
    this._socket.emit("console", {
        type: "log",
        msg: msg
    });
};

new SocketConsole("http://localhost:3000", ['error', 'info']);


/**
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('../SocketConsole/example/index.html');
});

io.on('connection', function(socket){
  socket.on('console', function(msg){
    console.log(msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

*/
