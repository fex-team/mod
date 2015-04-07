/**
 * 针对 fis 量身定做。
 * 由于编译期会处理并优化一些事情，所以此 amd loader 不需要考虑所有的用法。
 *
 * !!! ------ 注意
 *
 * 初衷是要一个没有 noralize path 和 amd plugin 的 amd loader,
 * 但是目前异步加载还存在一些bug，还是去使用 require.js 或者 esl.js
 *
 * 或者 pull request 一个可用的版本，谢谢。没有精力去修复了！
 *
 */
var require, define;
(function(undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        slice = [].slice,
        hasOwn = Object.prototype.hasOwnProperty,
        head = document.getElementsByTagName('head')[0],
        timeout = 5000,
        ext = '.js',
        handlers, req;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    handlers = {
        require: function() {
            return function() {
                return req.apply(undef, arguments);
            };
        },

        exports: function(name) {
            return hasProp(defined, name) ? defined[name] : (defined[name] = {});
        },

        module: function(name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: function() {
                    return (config && config.config && config.config[name]) || {};
                }
            };
        }
    };

    function callDep(name, callback) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];

            delete waiting[name];
            defining[name] = true;

            if (callback) {
                args[2] = (function(old, fn) {
                    var hacked = function() {
                        var ret = typeof old === 'function' ? old.apply(this, arguments) : old;

                        // 要等 return ret 后 defined 里面才有数据。
                        setTimeout(fn, 4);
                        return ret;
                    };
                    return (hacked._length = 1, hacked);
                })(args[2], callback);

                return main.apply(undef, args);
            }

            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }

        return callback ? callback() : defined[name];
    }

    function resolve(name) {
        var paths = config.paths || {},
            path = paths[name] || name;

        return /\.js$/.test(path) ? path : (path + ext);
    }

    function loadJs(url, cb) {
        var script = document.createElement('script'),
            loaded = false,

            clean = function() {
                clearTimeout(timer);
                script.onload = script.onreadystatechange = script.onerror = null;
                head.removeChild(script);
            },

            wrap = function() {
                if (!loaded && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
                    loaded = true;
                    clean();
                    cb();
                }
            },

            onerror = function() {
                clean();
                throw new Error('Can\'t load ' + url);
            },

            timer;

        script.setAttribute('src', url);
        script.setAttribute('type', 'text/javascript');
        script.onload = script.onreadystatechange = wrap;
        script.onerror = onerror;
        head.appendChild(script);
        timer = setTimeout(onerror, timeout);
    }

    function main(name, deps, callback) {
        var callbackType = typeof callback,
            args = [],
            usingExports = false,
            i = deps.length,
            next, len, cjsModule, depName;

        if (callbackType === 'undefined' || callbackType === 'function') {
            deps = !deps.length && (callback.length||callback._length) ? (i = 3, ['require', 'exports', 'module']) : deps;

            next = function() {
                var ret = callback ? callback.apply(defined[name], args) : undefined;

                if (name) {
                    if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                        defined[name] = cjsModule.exports;
                    } else if (ret !== undef || !usingExports) {
                        defined[name] = ret;
                    }
                }
            };

            while (i--) {
                next = (function(next, depName, i) {
                    return function() {
                        var path;

                        if (depName === "require") {
                            args[i] = handlers.require(name);
                        } else if (depName === "exports") {
                            args[i] = handlers.exports(name);
                            usingExports = true;
                        } else if (depName === "module") {
                            cjsModule = args[i] = handlers.module(name);
                        } else if (hasProp(defined, depName) ||
                            hasProp(waiting, depName) ||
                            hasProp(defining, depName)) {

                            return callDep(depName, function() {
                                args[i] = callDep(depName);
                                next();
                            });
                        } else {
                            path = resolve(depName);

                            return loadJs(path, function() {
                                callDep(depName, function() {
                                    args[i] = callDep(depName);
                                    next();
                                });
                            });
                        }
                        next();
                    }
                })(next, deps[i], i);
            }
            next();
        } else if (name) {
            defined[name] = callback;
        }
    }

    require = req = function(deps, callback) {
        if (typeof deps === "string") {
            return callDep(deps);
        }

        setTimeout(function() {
            main(undef, deps, callback);
        }, 4);
    };

    function extend(a, b) {
        var i, v;

        if (!a || !b || typeof b !== 'object') {
            return a;
        }

        for (i in b) {
            if (hasProp(b, i)) {
                v = b[i];

                if (typeof v === 'object' && !v.splice) {
                    extend(a[i] || (a[i] = {}), v);
                } else {
                    a[i] = v;
                }
            }
        }
    }

    req.config = function(cfg) {
        extend(config, cfg);
    };

    // define(id, deps ?, factory)
    define = function(name, deps, factory) {
        if (!deps.splice) {
            factory = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, factory];
        }
    }

    define.amd = {};
})();
