define('cross/3.js', function(require, exports, module){
//------------------------------------------------------------

exports.num = function() {
	return m1.val + m2.val; // 300
};

exports.val = 300;


var m1 = require('cross/1.js');
var m2 = require('cross/2.js');

//------------------------------------------------------------
});
