/**
 * 针对 fis 量身定做。
 * 由于编译期会处理并优化一些事情，所以此 amd loader 不需要考虑所有的用法。
 */
var requirejs, require, define;
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
    require: function () {
      return function () {
        return req.apply(undef, arguments);
      };
    },

    exports: function (name) {
      return hasProp(defined, name) ? defined[ name ] : (defined[name] = {});
    },

    module: function (name) {
      return {
        id: name,
        uri: '',
        exports: defined[name],
        config: function () {
          return (config && config.config && config.config[name]) || {};
        }
      };
    }
  };

  function callDep(name, callback) {
    if (hasProp(waiting, name)) {
      var args = waiting[name],
          origin;

      delete waiting[name];
      defining[name] = true;

      if (callback) {
        origin = args[2];
        args[2] = function(require) {
          var ret = typeof origin === 'function' ?
              origin.apply(this, arguments) : origin;
          setTimeout(callback, 4);
          origin = null;
          return ret;
        };

        return main.apply(undef, args);
      }

      main.apply(undef, args);
    }

    if (!hasProp(defined, name) && !hasProp(defining, name)) {
      throw new Error('No ' + name);
    }
    return callback ? callback() : defined[name];
  }

  function makeFinalize(name, callback, cjsModule, usingExports) {
    return function(args) {
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
  }

  function resolve(name) {
    var paths = config.paths || {},
        path = paths[name] || name;

    return /\.js$/.test(path) ? path : (path + ext);
  }

  function loadJs(url, cb) {
    var script = document.createElement('script'),
        loaded = false,

        wrap = function() {
          if (loaded) {
            return;
          }
          clearTimeout(timer);
          loaded = true;
          cb && cb();
        },

        onerror = function() {
          clearTimeout(timer);
          cb && cb(true);
        },

        timer;

    script.setAttribute('src', url);
    script.setAttribute('type', 'text/javascript');
    script.onload = wrap;
    script.onreadystatechange = wrap;
    script.onerror = onerror;
    head.appendChild(script);
    timer = setTimeout(onerror, timeout);
  }

  function loadDeps(deps, args, callback) {
    var i = deps.length,
        next = function() {
          callback(args);
        };

    while (i--) {
      next = (function(next, depName) {
        return function() {
          var path = resolve(depName);

          loadJs(path, function(error) {
            var idx;

            if (error) {
              throw new Error('Can\'t load ' + path);
            }

            idx = args.indexOf(depName);
            callDep(depName, function() {
              args.splice(idx, 1, callDep(depName));
              next();
            });
          });
        }
      })(next, deps[i]);
    }

    next();
  }

  function main(name, deps, callback) {
    var callbackType = typeof callback,
        args = [],
        usingExports = false,
        loading = [],
        finalize, i, len, cjsModule, depName;

    if (callbackType === 'undefined' || callbackType === 'function') {
      deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;

      for (i=0, len = deps.length; i < len; i++) {
        depName = deps[i];

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
          args[i] = callDep(depName);
        } else {
          args[i] = depName;
          loading.push(depName);
        }
      }

      finalize = makeFinalize(name, callback, cjsModule, usingExports);
      loading.length ? loadDeps(loading, args, finalize) : finalize(args);
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

  req.config = function (cfg) {
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

  // what does this mean?
  define.amd = {
    jQuery: true
  };
})();