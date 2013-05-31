define('ring/2.js', function(require, exports, module){
//------------------------------------------------------------

exports.test = function(i) {
	if (i == 0)
		return 1;
	else
    	return c3.test(i-1);
};

var c3 = require('ring/3.js');

//------------------------------------------------------------
});
