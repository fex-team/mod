define('single/car.js', function(require, exports, module){
//------------------------------------------------------------

var engine = require('single/engine.js');

exports.run = function(speed) {
    return engine.start(speed);
};



//------------------------------------------------------------
});
