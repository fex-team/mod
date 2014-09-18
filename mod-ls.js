/**
 * 针对 fis 量身定做。
 * 由于编译期会处理并优化一些事情，所以此 amd loader 不需要考虑所有的用法。
 */

var require, define, F;
(function(undef) {
    var head = document.getElementsByTagName('head')[0],
        loadingMap = {},
        factoryMap = {},
        modulesMap = {},
        scriptsMap = {},
        resMap = {},
        pkgMap = {};



    function createScript(url, onerror) {
        if (url in scriptsMap) return;
        scriptsMap[url] = true;

        var script = document.createElement('script');
        if (onerror) {
            var tid = setTimeout(onerror, require.timeout);

            script.onerror = function() {
                clearTimeout(tid);
                onerror();
            };

            function onload() {
                clearTimeout(tid);
            }

            if ('onload' in script) {
                script.onload = onload;
            }
            else {
                script.onreadystatechange = function() {
                    if (this.readyState == 'loaded' || this.readyState == 'complete') {
                        onload();
                    }
                }
            }
        }
        script.type = 'text/javascript';
        script.src = url;
        head.appendChild(script);
        return script;
    }

    function loadScript(id, callback, onerror) {
        var queue = loadingMap[id] || (loadingMap[id] = []);
        queue.push(callback);

        //
        // resource map query
        //
        var res = resMap[id] || {};
        var pkg = res.pkg;
        var url;

        if (pkg) {
            url = pkgMap[pkg].url;
        } else {
            url = res.url || id;
        }

        createScript(url, onerror && function() {
            onerror(id);
        });
    }

    define = function(id, factory) {
        factoryMap[id] = factory;

        var queue = loadingMap[id];
        if (queue) {
            for(var i = 0, n = queue.length; i < n; i++) {
                queue[i]();
            }
            delete loadingMap[id];
        }
    };

    require = function(id) {
        id = require.alias(id);

        var mod = modulesMap[id];
        if (mod) {
            return mod.exports;
        }

        //
        // init module
        //
        var factory = factoryMap[id];
        if (!factory) {
            throw '[ModJS] Cannot find module `' + id + '`';
        }

        mod = modulesMap[id] = {
            exports: {}
        };

        //
        // factory: function OR value
        //
        var ret = (typeof factory == 'function')
                ? factory.apply(mod, [require, mod.exports, mod])
                : factory;

        if (ret) {
            mod.exports = ret;
        }
        return mod.exports;
    };

    require.async = function(names, onload, onerror) {
        if (typeof names == 'string') {
            names = [names];
        }

        for(var i = 0, n = names.length; i < n; i++) {
            names[i] = require.alias(names[i]);
        }

        var needMap = {};
        var needNum = 0;

        function findNeed(depArr) {
            for(var i = 0, n = depArr.length; i < n; i++) {
                //
                // skip loading or loaded
                //
                var dep = depArr[i];
                if (dep in factoryMap || dep in needMap) {
                    continue;
                }

                needMap[dep] = true;
                needNum++;
                loadScript(dep, updateNeed, onerror);

                var child = resMap[dep];
                if (child && 'deps' in child) {
                    findNeed(child.deps);
                }
            }
        }

        function updateNeed() {
            if (0 == needNum--) {
                var args = [];
                for(var i = 0, n = names.length; i < n; i++) {
                    args[i] = require(names[i]);
                }

                onload && onload.apply(global, args);
            }
        }

        findNeed(names);
        updateNeed();
    };

    require.resourceMap = function(obj) {
        var k, col;

        // merge `res` & `pkg` fields
        col = obj.res;
        for(k in col) {
            if (col.hasOwnProperty(k)) {
                resMap[k] = col[k];
            }
        }

        col = obj.pkg;
        for(k in col) {
            if (col.hasOwnProperty(k)) {
                pkgMap[k] = col[k];
            }
        }
    };

    require.loadJs = function(url) {
        createScript(url);
    };

    require.loadCss = function(cfg) {
        if (cfg.content) {
            var sty = document.createElement('style');
            sty.type = 'text/css';

            if (sty.styleSheet) {       // IE
                sty.styleSheet.cssText = cfg.content;
            } else {
                sty.innerHTML = cfg.content;
            }
            head.appendChild(sty);
        }
        else if (cfg.url) {
            var link = document.createElement('link');
            link.href = cfg.url;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        }
    };


    require.alias = function(id) {return id};

    require.timeout = 5000;

    // ------------------------------
    //
    // ------------------------------

    var storage = (function() {

        function Base() {
            var data = {};

            this.get = function(key) {
                return key ? data[key] : data;
            };

            this.set = function(key, val) {
                if (arguments.length == 1) {
                    data = key;
                } else {
                    data[key] = val;
                    return val;
                }
            };

            this.save = this.clear = function() {
                // implements this.
            };
        }

        function LocalStorage() {
            Base.apply(this, arguments);

            var key = 'fis';

            var str = localStorage[key];

            if (str) {
                this.set(JSON.parse(str));
            }

            this.save = function() {
                localStorage[key] = JSON.stringify(this.get());
            };

            this.clear = function() {
                delete localStorage[key];
            };
        }

        function indexedDB() {
            // 待调研
        }

        function factory() {
            // 根据运行时能力来实例化一个最优的方案。
            return new LocalStorage();
        }

        return factory();
    })();

    var resource = (function(storage) {
        var api = {};

        function ajax(url, cb, data) {
            var xhr = new(window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');

            xhr.onreadystatechange = function() {
                if (this.readyState == 4) {
                    cb(this.responseText);
                }
            };
            xhr.open(data ? 'POST' : 'GET', url + '&t=' + ~~(Math.random() * 1e6), true);

            if (data) {
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send(data);
        }

        var head = document.getElementsByTagName('head')[0];
        function globalEval(code) {
            var script;

            code = code.replace(/^\s+/, '').replace(/\s+$/, '');

            if (code) {
                if (code.indexOf('use strict') === 1) {
                    script = document.createElement('script');
                    script.text = code;
                    head.appendChild(script).parentNode.removeChild(script);
                } else {
                    eval(code);
                }
            }
        }

        function appendStyle(code) {
            var dom = document.createElement('style');
            dom.innerHTML = code;
            head.appendChild(dom);
        }

        function each(obj, iterator) {
            // is array
            if (obj.splice) {
                obj.forEach(iterator);
            } else {
                for (var key in obj) {
                    obj.hasOwnProperty(key) && iterator(obj[key], key);
                }
            }
        }

        function isEmpty(obj) {
            if (obj) {
                for (var key in obj) {
                    return false;
                }
            }

            return true;
        }

        api.getChangeList = function(pkgs, done) {
            var list = [];
            var ret = {};

            each(pkgs, function(item) {
                var pkg = storage.get(item.id);

                if (!pkg) {
                    ret[item.id] = [];
                } else if (item.hash != pkg.hash) {
                    ret[item.id] = [];
                    list.push(item.id);
                }
            });

            if (list.length) {
                // 需要进一步检测
                ajax('/fis-diff?type=list', function(response) {
                    response = JSON.parse(response);
                    var data = response.data;

                    each(data, function(item, id) {
                        var pkg = storage.get(id) || storage.set(id, {});
                        var oldlist = pkg.list || [];

                        pkg.list = item.list.concat();
                        pkg.hash = item.hash;
                        pkg.type = item.type;
                        pkg.data = pkg.data || {};

                        each(item.list, function(hash) {
                            ~oldlist.indexOf(hash) || ret[id].push(hash);
                        });
                    })

                    done(ret);
                }, 'pids='+list.join(','));
            } else {
                done(ret);
            }
        };

        api.updatePkgs = function(data) {
            each(data, function(item, id) {
                var pkg = storage.get(id) || storage.set(id, {});
                var list = [];

                pkg.data = pkg.data || {};
                each(item.data, function(part) {
                    list.push(part.hash);
                    pkg.data[part.hash] = part.content;
                });

                pkg.hash = item.hash;
                pkg.type = item.type;
                (!pkg.list || !pkg.list.length) && (pkg.list = list);
            });

            storage.save();
        };

        api.fetchPkgs = function(obj, done) {
            var params = [];

            each(obj, function(list, id) {
                params.push('' + id + '=' + list.join(','));
            });

            ajax('/fis-diff?type=data', function(response) {
                response = JSON.parse(response);
                var data = response.data;
                api.updatePkgs(data);
                done();
            }, params.join('&'));
        };

        api.load = function(pkgs, done) {
            var runjs = function() {
                var js = '';
                var css = '';

                each(pkgs, function(item) {
                    var pkg = storage.get(item.id);
                    var hashs = pkg.list;
                    var content = '';

                    each(hashs, function(hash) {
                        content += pkg.data[hash];
                    });

                    if (pkg.type === 'js') {
                        js += content;
                    } else {
                        css += content;
                    }
                });

                css && appendStyle(css);
                js && globalEval(js);
                done();
            };

            api.getChangeList(pkgs, function(data) {
                if (!isEmpty(data)) {
                    api.fetchPkgs(data, runjs);
                } else {
                    runjs();
                }
            });
        }

        return api;
    })(storage);

    // expose
    F = resource.load;
    F.load = F;
})();