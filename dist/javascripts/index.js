'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (gb) {
    function copyObj(obj) {
        var a = {};
        for (var k in obj) {
            if (isArray(obj[k])) {
                a[k] = [];
                for (var ki in obj[k]) {
                    a[k].push(obj[k][ki]);
                }
            } else if (obj.hasOwnProperty(k)) {
                a[k] = _typeof(obj[k]) == 'object' ? copyObj(obj[k]) : obj[k];
            }
        }
        return a;
    }
    function forOf(o, fn, t, dc) {
        if (dc) o = copyObj(o);
        t = t || this;
        for (var k in o) {
            if (!o.hasOwnProperty(k) || fn.call(t, o[k], k) == false) break;
        }
    }

    //
    var NODE_TYPE_TEXT = 3;
    var NODE_TYPE_ELEMENT = 1;

    var lbind = {
        $bind: function $bind() {
            this.$event();
            this.$lmodel();
        },
        $event: function $event() {
            var levent_dom = document.querySelectorAll('[levent]'),
                _this = this;
            forOf(levent_dom, function (v) {
                var attrs = v.getAttribute('levent').split('&');
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    var _loop = function _loop() {
                        var attr = _step.value;

                        var events = attr.split(":")[0].split("~"),
                            fn = attr.split(":")[1],
                            fnName = fn.match(/([\w\d]+)\(/)[1],
                            args = fn.match(/\(([^\)]+)\)/);
                        if (args) args = args[1].split(",");
                        v.removeAttribute('levent');
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = events[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var event = _step2.value;

                                v.addEventListener(event, function (e) {
                                    for (var i in args) {
                                        var arg = args[i];
                                        if (arg === "$event") {
                                            args[i] = e;
                                            continue;
                                        }
                                        if (!isNaN(parseInt(arg))) {
                                            args[i] = parseInt(arg);
                                            continue;
                                        }

                                        if (!/^['"]/.test(arg)) {
                                            var bindval = objectGetValue(arg);
                                            if (bindval) args[i] = bindval;
                                        } else {
                                            args[i] = arg.replace(/^['"]/, '').replace(/['"]$/, '');
                                        }
                                    }
                                    var fnReturn = _this.$scope[fnName].apply(this, args);
                                    eachTexts(this);
                                    return fnReturn;
                                });
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }
                    };

                    for (var _iterator = attrs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        _loop();
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            });
        },
        $lmodel: function $lmodel() {
            var lmodel_dom = document.querySelectorAll('[lmodel]'),
                _this = this,
                inps = this.$elems.inps,
                watchers = this.$scope.$$watchers;
            forOf(lmodel_dom, function (v) {
                var attr = v.getAttribute('lmodel');
                var wobj = getObject(attr);
                console.log(wobj);
                watchers.push({
                    last: v.value = objectGetValue(attr),
                    elem: v,
                    reg: attr,
                    obj: wobj,
                    get: function get() {
                        var obj = this.obj;
                        return obj.obj[obj.key];
                    },
                    set: function set(v) {
                        this.last = this.elem.value = v;
                    }
                });
                v.addEventListener('input', function () {
                    wobj.obj[wobj.key] = this.value;
                    var DateTime = Date.now();
                    eachTexts(this);
                    console.log(Date.now() - DateTime);
                });
            });
        },
        $lFor: function $lFor() {},
        $scope: {
            $$watchers: []
        },
        $elems: {
            texts: [],
            inps: [],
            attrs: []
        }
    };

    var $$watchers = lbind.$scope.$$watchers;

    //创建数据监听
    function createWatch(elem, last, reg, cureg, obj, key, get, set) {
        $$watchers.push({
            elem: elem, last: last,
            reg: reg, cureg: cureg, obj: obj,
            key: key, get: get, set: set,
            setLast: function setLast() {
                var next = $$watchers[this.index + 1];
                if (next && next.cureg === this.cureg && next.elem === this.elem) {
                    next.last = this.last;
                    return next.setLast();
                }
            },
            index: $$watchers.length
        });
    }

    //监听数据变化
    function eachTexts(elem) {
        var watchers = lbind.$scope.$$watchers,
            resolvetext = void 0;
        forOf(watchers, function (w) {
            resolvetext = w.get();
            if (resolvetext !== w.last && elem !== w.elem) {
                w.set(resolvetext);
            }
        });
    }

    //初始化解析
    function eachText(elem) {
        var childs = elem.childNodes,
            watchers = lbind.$scope.$$watchers,
            child = void 0,
            textContent = void 0,
            templateReg = /(?={{).+}}/,
            attrkey = void 0,
            attrvalue = void 0,
            resolve = void 0;
        forOf(childs, function (child) {
            switch (child.nodeType) {
                case NODE_TYPE_TEXT:
                    textContent = child.textContent;
                    if (templateReg.test(textContent)) {
                        child.textContent = resolveText(textContent, child);
                    }
                    break;
                case NODE_TYPE_ELEMENT:
                    forOf(child.attributes, function (v) {
                        textContent = v.value;
                        if (templateReg.test(textContent)) {
                            attrkey = v.name;
                            attrvalue = resolveText(textContent, child, attrkey);
                            child.setAttribute(attrkey, attrvalue);
                        }
                    });
                    eachText(child);
                    break;
                default:
                    eachText(child);
            }
        });
    }

    //解析花括号
    function resolveText(text, elem, key) {
        var m = text.match(/(?={{)(.+?)}}/g);
        var attr = void 0,
            value = void 0,
            oldresolve = text;
        forOf(m, function (v) {
            attr = v.match(/[^{^}]+/)[0];
            value = objectGetValue(attr) || '';
            if (elem) {
                createWatch(elem, value, oldresolve, v, getObject(attr), key, function () {
                    var so = this.obj;
                    return so.obj[so.key];
                }, function (v) {
                    var elem = this.elem,
                        value = resolveText(this.reg);
                    switch (elem.nodeType) {
                        case NODE_TYPE_TEXT:
                            elem.textContent = value;
                            break;
                        case NODE_TYPE_ELEMENT:
                            elem.setAttribute(this.key, value);
                            break;
                    }
                    this.last = v;
                    this.setLast();
                });
            }
            text = text.replace(v, value);
        });
        return text;
    }

    //解析对象 
    function objectGetValue(o) {
        if (typeof o !== 'string') return null;
        var attr = o.split('.'),
            arrReg = /([^\[]+)\[(\d)\]/;
        var $scope = lbind.$scope;
        forOf(attr, function (v, i) {
            var k = v.match(arrReg);
            if (k) {
                $scope = $scope[k[1]][k[2]];
            } else {
                $scope = $scope[v];
            }
            if (typeof $scope === "undefined" || $scope === null) return null;
        });
        return $scope || '';
    }

    //通过字符串设置对象属性值
    function objectSetValue(o, val) {
        if (typeof o !== 'string') return null;
        var attr = o.split('.'),
            arrReg = /([^\[]+)\[(\d)\]/,
            attrLength = attr.length;
        var $scope = lbind.$scope;
        forOf(attr, function (v, i) {
            var k = v.match(arrReg);
            if (k) {
                if (i == attrLength - 1) {
                    $scope[k[1]][k[2]] = val;
                    return false;
                }
                $scope = $scope[k[1]][k[2]];
            } else {
                if (i == attrLength - 1) {
                    $scope[v] = val;
                    return false;
                }
                $scope = $scope[v];
            }
        });
        return $scope;
    }

    //获取对象
    function getObject(o) {
        if (typeof o !== 'string') return null;
        var attr = o.split('.'),
            obj = null,
            arrReg = /([^\[]+)\[(\d)\]/,
            attrLength = attr.length;
        var $scope = lbind.$scope;
        forOf(attr, function (v, i) {
            var k = v.match(arrReg);
            if (k) {
                if (i == attrLength - 1) {
                    obj = { obj: $scope[k[1]], key: k[2] };
                    return false;
                }
                $scope = $scope[k[1]][k[2]];
            } else {
                if (i == attrLength - 1) {
                    obj = { obj: $scope, key: v };
                    return false;
                }
                $scope = $scope[v];
            }
        });
        return obj;
    }

    gb.bootEach = function (App) {
        eachText(App);
        lbind.$bind();
    };
    gb.lbind = lbind;
    gb.eachTexts = eachTexts;
})(window);