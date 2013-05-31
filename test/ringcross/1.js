define('ringcross/1.js', function(require, exports, module){
//------------------------------------------------------------

exports.test = function() {
	return m1.val + m2.val + m3.val;
};

exports.val = 100;

var m1 = require('ringcross/1.js');
var m2 = require('ringcross/2.js');
var m3 = require('ringcross/3.js');

//------------------------------------------------------------
});
