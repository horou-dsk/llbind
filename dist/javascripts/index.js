'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (gb) {
    function forOf(o, fn, t, dc) {
        if (dc) o = copyObj(o);
        t = t || this;
        for (var k in o) {
            if (!o.hasOwnProperty(k) || fn.call(t, o[k], k) == false) break;
        }
    }

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
                watchers.push({
                    last: v.value = objectGetValue(attr),
                    elem: v,
                    reg: attr,
                    obj: getObject(attr),
                    get: function get() {
                        var obj = this.obj;
                        return obj.obj[obj.key];
                    },
                    set: function set(v) {
                        this.last = this.elem.value = v;
                    }
                });
                v.addEventListener('input', function () {
                    objectSetValue(attr, this.value);
                    var DateTime = Date.now();
                    eachTexts(this);
                    console.log(Date.now() - DateTime);
                });
            });
        },
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

    function eachTexts(elem) {
        var watchers = lbind.$scope.$$watchers,
            resolvetext = void 0;
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = watchers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var w = _step3.value;

                resolvetext = w.get();
                if (resolvetext !== w.last && elem !== w.elem) {
                    w.set(resolvetext);
                }
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }
    }

    function eachText(elem) {
        var childs = elem.childNodes,
            watchers = lbind.$scope.$$watchers,
            child = void 0,
            textContent = void 0,
            templateReg = /(?={{).+}}/,
            attrkey = void 0,
            attrvalue = void 0,
            resolve = void 0;
        for (var i = 0; i < childs.length; i++) {
            child = childs[i];
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
        }
    }

    function resolveText(text, elem, key) {
        var m = text.match(/(?={{)(.+?)}}/g);
        var attr = void 0,
            value = void 0,
            oldresolve = text;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = m[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var v = _step4.value;

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
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        return text;
    }

    function objectGetValue(o) {
        if (typeof o !== 'string') return null;
        var attr = o.split('.');
        var val = lbind.$scope[attr[0]];
        for (var i in attr) {
            if (typeof val === 'undefined' || val === null) return null;
            if (i > 0) {
                val = val[attr[i]];
            }
        }
        return val || '';
    }

    function objectSetValue(o, v) {
        if (typeof o !== 'string') return null;
        var attr = o.split('.');
        var val = lbind.$scope[attr[0]];
        if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) !== 'object') {
            lbind.$scope[attr[0]] = v;
            return true;
        }
        for (var i in attr) {
            if (i > 0) {
                var obj = val[attr[i]];
                if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
                    val[attr[i]] = v;
                    return true;
                } else {
                    val = obj;
                }
            }
        }
        return false;
    }

    function getObject(o) {
        if (typeof o !== 'string') return null;
        var attr = o.split('.'),
            obj = void 0;
        var val = lbind.$scope[attr[0]];
        if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) !== 'object') {
            return { obj: lbind.$scope, key: attr[0] };
        }
        for (var i in attr) {
            if (i > 0) {
                obj = val[attr[i]];
                if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
                    return { obj: val, key: attr[i] };
                } else {
                    val = obj;
                }
            }
        }
        return null;
    }

    gb.bootEach = function (App) {
        eachText(App);
        lbind.$bind();
    };
    gb.lbind = lbind;
    gb.eachTexts = eachTexts;
})(window);