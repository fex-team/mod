define('self/1.js', function(require, exports, module){
//------------------------------------------------------------

module.exports = {
	test: function() {
		return mod.val;
	},
	val: 123
};

var mod = require('self/1.js');

//------------------------------------------------------------
});
