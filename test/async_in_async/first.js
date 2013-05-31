define('async_in_async/first.js', function(require, exports, module){
//------------------------------------------------------------

exports.load = function(cb) {

	require.async('async_in_async/second.js', function(mod) {
		mod.setTimeout(cb, 10);
	});

};

//------------------------------------------------------------
});
