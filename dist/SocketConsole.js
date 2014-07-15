
/*!
 * SocketConsole - Send console messages over a Socket.io connection
 * v0.1.0
 * http://lgoldstien.github.io/SocketConsole
 * copyright Lawrence Goldstien 2014
 * MIT License
*/
//SocketConsole.js

var SocketConsole = function () {
    this._startSocket();
    this._replaceConsole();
};

SocketConsole.prototype._replaceConsole = function () {

    this._oldConsole = console;
};

console.log("Hijacking Console");
new SocketConsole("localhost:3000");