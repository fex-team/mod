define('multi/root.js', function(require, exports, module){
//------------------------------------------------------------

var m1 = require('multi/1.js');
var m2 = require('multi/2.js');


exports.show = function() {
    return m1.num() + m2.num();
};

//------------------------------------------------------------
});
