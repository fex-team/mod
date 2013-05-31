define('circle/2.js', ['circle/3.js'], function(require, exports, module){
//------------------------------------------------------------

exports.test = function() {
    return c3.test();
};

var c3 = require('circle/3.js');

//------------------------------------------------------------
});
