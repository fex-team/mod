define('ring/1.js', function(require, exports, module){
//------------------------------------------------------------

exports.test = function(i) {
	if (i == 0)
		return 1;
	else
    	return c2.test(i-1);
};

var c2 = require('ring/2.js');

//------------------------------------------------------------
});
