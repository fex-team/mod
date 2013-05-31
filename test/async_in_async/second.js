define('async_in_async/second.js', function(require, exports, module){
//------------------------------------------------------------

exports.setTimeout = function(cb, time) {
	setTimeout(cb, time);
};

//------------------------------------------------------------
});
