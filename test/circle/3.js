define('circle/3.js', ['circle/1.js'], function(require, exports, module){
//------------------------------------------------------------

exports.test = function() {
    return c1.test();
};

var c1 = require('circle/1.js');

//------------------------------------------------------------
});
