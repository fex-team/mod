var require, define;

(function() {
    var head = document.getElementsByTagName('head')[0];
        resourceMap = {},
        loadingMap = {},
        factoryMap = {},
        modulesMap = {};


    function loadScript(id, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = id;
        head.appendChild(script);

        var queue = loadingMap[id] || (loadingMap[id] = []);
        queue.push(callback);
    }

    define = function(id, factory) {
        factoryMap[id] = factory;

        var queue = loadingMap[id];
        if (queue) {
            for(var i = queue.length - 1; i >= 0; --i) {
                queue[i]();
            }
            delete loadingMap[id];
        }
    };

    require = function(id) {
        var mod = modulesMap[id];
        if (mod) {
            return mod['exports'];
        }

        //
        // init module
        //
        var factory = factoryMap[id];
        if (!factory) {
            throw new Error('Cannot find module `' + id + '`');
        }

        mod = modulesMap[id] = {
            'exports': {}
        };

        //
        // factory: function OR value
        //
        var ret = (typeof factory === 'function')
                ? factory.apply(mod, [require, mod['exports'], mod])
                : factory;

        if (ret) {
            mod['exports'] = ret;
        }
        return mod['exports'];
    };

    require.async = function(names, callback) {
        if (typeof names === 'string') {
            names = [names];
        }
        
        var needMap = {};
        var needNum = 0;

        function findNeed(depArr) {
            for(var i = depArr.length - 1; i >= 0; --i) {
                //
                // skip loading or loaded
                //
                var dep = depArr[i];
                if (dep in factoryMap || dep in needMap) {
                    continue;
                }

                needMap[dep] = true;
                needNum++;
                loadScript(dep, updateNeed);

                var child = resourceMap[dep];
                if (child) {
                    findNeed(child.deps);
                }
            }
        }

        function updateNeed() {
            if (0 === needNum--) {
                var i, args = [];
                for(i = names.length - 1; i >= 0; --i) {
                    args[i] = require(names[i]);
                }
                callback.apply(this, args);
            }
        }
        
        findNeed(names);
        updateNeed();
    };

    require.resourceMap = function(obj) {
        var res = obj['res'];
        if (res) {
            for(var k in res) {
                if (res.hasOwnProperty(k)) {
                    resourceMap[k] = res[k];
                }
            }
        }

        var pkg = obj['pkg'];
        if (pkg) {
            //...
        }
    };

    define.amd = {
        'jQuery': true,
        'version': '1.0.0'
    };

})();
