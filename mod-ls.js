var require, define, F;
(function(global, undef) {
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

    // -----------------------------------------------------------
    // ------------------------ 分割线 ----------------------------
    //
    // 上部分：amd loader
    // 下部分：localstorage
    //
    // -----------------------------------------------------------
    // -----------------------------------------------------------

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
        // is array?
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

    function extend(a, b) {
        var i, v;

        if (!a || !b || typeof b !== 'object') {
            return a;
        }

        each(b, function(v, i) {
            if (typeof v === 'object' && !v.splice) {
                extend(a[i] || (a[i] = {}), v);
            } else {
                a[i] = v;
            }
        });

        return a;
    }

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

            this.save = this.clear = this.init = function() {
                // implements this.
            };
        }

        function LocalStorage() {
            Base.apply(this, arguments);
            var me = this;
            var inited = false;

            this.init = function() {

                // 避免重复初始化。
                if (inited) {
                    return;
                }

                inited = true;

                var prefix = config.fid;

                each(localStorage, function(val, key) {
                    if (key.substring(0, prefix.length) === prefix) {
                        me.set(key.substring(prefix.length), JSON.parse(val));
                    }
                });
            }

            this.save = function(id) {
                var obj = me.get(id);
                var prefix = config.fid;

                if (id) {
                    var tmp = {};
                    tmp[id] = obj;
                    obj = tmp;
                }

                each(obj, function(val, key) {
                    try {
                        localStorage[prefix + key] = JSON.stringify(val);
                    } catch (e) {
                        // 没存入也没关系，程序可以正常运行
                    }
                });
            };

            this.clear = function() {
                var prefix = config.fid;

                each(localStorage, function(val, key) {
                    if (key.substring(0, prefix.length) === prefix) {
                        delete localstorage[key];
                    }
                });
            };
        }

        function IndexedDB() {
            // 待调研
        }

        function factory() {
            // todo 根据运行时能力来实例化一个最优的方案。
            return new LocalStorage();
        }

        return factory();
    })();


    var resource = (function(storage) {
        var api = {};

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
                ajax(config.listLink, function(response) {
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

                        if (!ret[id].length) {
                            delete ret[id];
                            storage.save(id);
                        }
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

            ajax(config.dataLink, function(response) {
                response = JSON.parse(response);
                var data = response.data;
                api.updatePkgs(data);
                done();
            }, params.join('&'));
        };

        api.load = function(pkgs, done) {
            var ran = function() {
                var js = '';
                var css = '';

                each(pkgs, function(item) {
                    var pkg = storage.get(item.id);
                    var hashs = this.list || pkg.list;
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
                done && done();
            };

            storage.init();

            api.getChangeList(pkgs, function(data) {
                if (!isEmpty(data)) {
                    api.fetchPkgs(data, ran);
                } else {
                    ran();
                }
            });
        }

        return api;
    })(storage);

    var config = {
        fid: 'fis-',
        rate: 0.01,
        listLink: '/fis-diff?type=list',
        dataLink: '/fis-diff?type=data'
    };

    // expose
    F = resource.load;
    F.load = F;

    F.config = function(cfg) {
        return extend(config, cfg);
    };

    // hack require.async
    require.async = (function(older) {

        function findDeps(name, map, data) {
            var obj = map.res[name];
            var key = obj.key;
            var pkg = obj.pkg;

            if (pkg) {
                key = map.pkg[pkg].key;
            }

            var arr = data[key] || (data[key] = {id: key, hash: obj.hash});

            pkg && (arr.list || (arr.list = [])).push(obj.hash);

            obj.deps && obj.deps.length && each(obj.deps, function(dep) {
                findDeps(dep, map, data);
            });
        }

        return function(name, callback) {
            var map = config.ls_resourceMap;
            var args = arguments;

            if (typeof name === 'string') {
                name = [name];
            }

            var data = {};
            each(name, function(name) {
                findDeps(name, map, data)
            });

            resource.load(data, function() {
                older.apply(null, args);
            });
        };
    })(require.async);
})(this);