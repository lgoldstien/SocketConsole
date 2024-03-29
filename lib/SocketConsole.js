//SocketConsole.js
var SocketConsole = function(socketIOAddr, overrides) {
    /** Internalise arguments */
    this.__socketIOAddr = socketIOAddr;
    this.__overrides = overrides;

    /** Only replace the console if we can connect to the socket server */
    this._startSocket(socketIOAddr);
};

SocketConsole.prototype._replaceConsole = function() {
    var scope = this;

    if (this._hasOverrides)
        return false;

    console.info("SocketConsole: attempting to hijack the console");

    this.__overrides.forEach(function(override) {
        var func = window.console[override];

        window.console[override] = function() {
            func.apply(console, arguments);
            scope._emit(override, scope._stringify(arguments));
        };
    });

    var winOnError = window.onerror;
    var errorHandler = function() {
        if (winOnError)
            winOnError.apply(window, arguments);

        scope._emit("window.onerror", scope._stringify(arguments));

        return false;
    };

    window.onerror = errorHandler;
    document.onerror = errorHandler;

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

// JSON.prune
// JSON.prune : a function to stringify any object without overflow
// two additional optional parameters :
//   - the maximal depth (default : 6)
//   - the maximal length of arrays (default : 50)
// You can also pass an "options" object.
// examples :
//   var json = JSON.prune(window)
//   var arr = Array.apply(0,Array(1000)); var json = JSON.prune(arr, 4, 20)
//   var json = JSON.prune(window.location, {inheritedProperties:true})
// Web site : http://dystroy.org/JSON.prune/
// JSON.prune on github : https://github.com/Canop/JSON.prune
// This was discussed here : http://stackoverflow.com/q/13861254/263525
// The code is based on Douglas Crockford's code : https://github.com/douglascrockford/JSON-js/blob/master/json2.js
// No effort was done to support old browsers. JSON.prune will fail on IE8.
(function() {
    'use strict';

    var DEFAULT_MAX_DEPTH = 6;
    var DEFAULT_ARRAY_MAX_LENGTH = 50;
    var seen; // Same variable used for all stringifications
    var iterator; // either forEachEnumerableOwnProperty, forEachEnumerableProperty or forEachProperty

    // iterates on enumerable own properties (default behavior)
    var forEachEnumerableOwnProperty = function(obj, callback) {
        for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) callback(k);
        }
    };
    // iterates on enumerable properties
    var forEachEnumerableProperty = function(obj, callback) {
        for (var k in obj) callback(k);
    };
    // iterates on properties, even non enumerable and inherited ones
    // This is dangerous
    var forEachProperty = function(obj, callback, excluded) {
        if (obj === null) return;
        excluded = excluded || {};
        Object.getOwnPropertyNames(obj).forEach(function(k) {
            if (!excluded[k]) {
                callback(k);
                excluded[k] = true;
            }
        });
        forEachProperty(Object.getPrototypeOf(obj), callback, excluded);
    };

    Date.prototype.toPrunedJSON = Date.prototype.toJSON;
    String.prototype.toPrunedJSON = String.prototype.toJSON;

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        meta = { // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    function str(key, holder, depthDecr, arrayMaxLength) {
        var i, k, v, length, partial, value = holder[key];
        if (value && typeof value === 'object' && typeof value.toPrunedJSON === 'function') {
            value = value.toPrunedJSON(key);
        }

        switch (typeof value) {
            case 'string':
                return quote(value);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'boolean':
            case 'null':
                return String(value);
            case 'object':
                if (!value) {
                    return 'null';
                }
                if (depthDecr <= 0 || seen.indexOf(value) !== -1) {
                    return '"-pruned-"';
                }
                seen.push(value);
                partial = [];
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    length = Math.min(value.length, arrayMaxLength);
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value, depthDecr - 1, arrayMaxLength) || 'null';
                    }
                    return '[' + partial.join(',') + ']';
                }
                iterator(value, function(k) {
                    try {
                        v = str(k, value, depthDecr - 1, arrayMaxLength);
                        if (v) partial.push(quote(k) + ':' + v);
                    } catch (e) {
                        // this try/catch due to forbidden accessors on some objects
                    }
                });
                return '{' + partial.join(',') + '}';
        }
    }

    JSON.prune = function(value, depthDecr, arrayMaxLength) {
        if (typeof depthDecr == "object") {
            var options = depthDecr;
            depthDecr = options.depthDecr;
            arrayMaxLength = options.arrayMaxLength;
            iterator = options.iterator || forEachEnumerableOwnProperty;
            if (options.allProperties) iterator = forEachProperty;
            else if (options.inheritedProperties) iterator = forEachEnumerableProperty;
        } else {
            iterator = forEachEnumerableOwnProperty;
        }
        seen = [];
        depthDecr = depthDecr || DEFAULT_MAX_DEPTH;
        arrayMaxLength = arrayMaxLength || DEFAULT_ARRAY_MAX_LENGTH;
        return str('', {
            '': value
        }, depthDecr, arrayMaxLength);
    };

    JSON.prune.log = function() {
        console.log.apply(console, Array.prototype.slice.call(arguments).map(function(v) {
            return JSON.parse(JSON.prune(v));
        }));
    };
    JSON.prune.forEachProperty = forEachProperty; // you might want to also assign it to Object.forEachProperty

}());

SocketConsole.prototype._stringify = JSON.prune;
