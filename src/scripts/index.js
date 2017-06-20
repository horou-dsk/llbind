(function (gb) {
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
    function copyObj(obj) {
        var a = {};
        for (var k in obj) {
            if (isArray(obj[k])) {
                a[k] = [];
                for (var ki in obj[k]) {
                    a[k].push(obj[k][ki]);
                }
            } else if (obj.hasOwnProperty(k)) {
                a[k] = typeof obj[k] == 'object' ? copyObj(obj[k]) : obj[k];
            }
        }
        return a;
    }
    function forOf(o, fn, t, dc) {
        if (dc)
            o = copyObj(o);
        t = t || this;
        for (var k in o) {
            if (!o.hasOwnProperty(k) || fn.call(t, o[k], k) == false) return false;
        }
        return true;
    }

    function isObject(value) {
        return value !== null && typeof value === 'object';
    }

    function createComment(directiveName, comment) {
        var content = '';
        content = ' ' + (directiveName || '') + ': ';
        if (comment) content += comment + ' ';
        return window.document.createComment(content);
    };

    function elemAddBefore(_this, elem) {
        if (_this.parentNode) {
            _this.parentNode.insertBefore(elem, _this);
        }
    }
    function elemAddAfter(_this, elem) {
        if (_this.parentNode) {
            _this.parentNode.insertBefore(elem, _this.nextSibling);
        }
    }
    function sibling(cur, dir) {
        while ((cur = cur[dir]) && cur.nodeType !== 1) { }
        return cur;
    }
    function nextElemt(elem) {
        return sibling(elem, "nextSibling");
    }



    function createScope() {
        var $$scope = function () {
            this.$$watchers = [];
            this.$apply = eachTexts;
            this.$index = 0;
            this.$parentScope = this.$childHeadScope = this.$childLastScope = this.$nextScope = this.$prevScope = null;
        }
        $$scope.prototype = {
            addChildScope(scope) {
                if (this.$childHeadScope) {
                    let lastScope = this.$childLastScope;
                    lastScope.$nextScope = scope;
                    scope.$prevScope = lastScope;
                    this.$childLastScope = scope;
                } else {
                    this.$childHeadScope = scope;
                    this.$childLastScope = scope;
                }
                scope.$parentScope = this;
            }
        }
        return new $$scope();
    }

    function removeScope(scope) {
        let prevScope = scope.$prevScope;
        let nextScope = scope.$nextScope;
        let parentScope = scope.$parentScope;
        if (prevScope && nextScope) {
            prevScope.$nextScope = nextScope;
            nextScope.$prevScope = prevScope;
        } else if (!prevScope&&!nextScope) {
            parentScope.$childHeadScope = null;
            parentScope.$childLastScope = null;
        } else if (!nextScope) {
            prevScope.$nextScope = null;
            parentScope.$childLastScope = prevScope;
        } else if (!prevScope){
            nextScope.$prevScope = null;
            parentScope.$childHeadScope = nextScope;
        }
        return scope;
    }
    //
    var NODE_TYPE_TEXT = 3;
    var NODE_TYPE_ELEMENT = 1;
    var NODE_TYPE_COMMENT = 8;
    var llFors = {};

    let llbind = {
        $bind: function () {
            this.$llFor();
            this.$llmodel();
            this.$event();
        },
        $event: function () {
            let levent_dom = document.querySelectorAll('[llevent]'),
                _this = this;
            forOf(levent_dom, function (v) {
                let attrs = v.getAttribute('llevent').split('&');
                forOf(attrs, function (attr) {
                    let events = attr.split(":")[0].split("~"),
                        fn = attr.split(":")[1],
                        fnName = fn.match(/([\w\d]+)\(/)[1],
                        args = fn.match(/\(([^\)]+)\)/);
                    if (args) args = args[1].split(",");
                    v.removeAttribute('llevent');
                    forOf(events, function (event) {
                        v.addEventListener(event, function (e) {
                            let cargs
                            if (isArray(args))
                                cargs = args.slice(0)
                            else
                                cargs = [];
                            forOf(cargs, function (a, i) {
                                let arg = cargs[i];
                                if (arg === "$event") {
                                    cargs[i] = e;
                                    return true;
                                }
                                if (!isNaN(parseInt(arg))) {
                                    cargs[i] = parseInt(arg);
                                    return true;
                                }

                                if (!/^['"]/.test(arg)) {
                                    let bindval = objectGetValue(arg);
                                    if (bindval) cargs[i] = bindval;
                                } else {
                                    cargs[i] = arg.replace(/^['"]/, '').replace(/['"]$/, '');
                                }
                            });
                            let fnReturn = _this.$scope[fnName].apply(this, cargs);
                            eachTexts(this);
                            return fnReturn;
                        });
                    });
                });
            });

        },
        $llmodel: function () {
            let lmodel_dom = document.querySelectorAll('[llmodel]'),
                _this = this,
                inps = this.$elems.inps,
                watchers = this.$scope.$$watchers;
            forOf(lmodel_dom, function (elem) {
                let attr = elem.getAttribute('llmodel');
                let wobj = getObject(attr);
                elem.value = wobj.obj[wobj.key];
                createWatch(wobj, function (v) {
                    this.last = v;
                    if (elem.value != v)
                        elem.value = v;
                });
                elem.addEventListener('input', function () {
                    wobj.obj[wobj.key] = this.value;
                    //var DateTime=Date.now();
                    eachTexts();
                    //console.log(Date.now()-DateTime);
                });
            });
        },
        $llFor: function (args) {
            // let for_doms=args||document.querySelectorAll('[ll-For]'),
            //     $scope=this.$scope;
            // forOf(for_doms,(for_dom)=>{
            //     let match=for_dom.getAttribute("ll-For").match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+of\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
            //     console.log(match);
            //     let fordom=for_dom.cloneNode(true);
            //     let object={
            //         fhs: match[0],
            //         lhs: match[1],
            //         rhs: match[2],
            //         askey: match[3],
            //         fordom: fordom
            //     };
            //     let forComment=createComment("llFor",object.fhs);
            //     elemAddBefore(for_dom,forComment);
            //     //let val=$scope.$forScope[lhs]=object.obj[object.key];
            //     llFors[forComment.textContent]=object;
            //     for_dom.remove();
            //     /*if(!val)return;
            //     for(var i = 0; i<val.length;i++){
            //         elemAddAfter(forComment,fordom);
            //         elemAddAfter(fordom,createComment("end llFor",fhs));
            //         fordom=fordom.cloneNode(true);
            //     }*/
            //     //let rg
            // });
        },
        $scope: createScope(),
        $elems: {
            texts: [],
            inps: [],
            attrs: []
        }
    }

    let $$watchers = llbind.$scope.$$watchers;
    let $currentScope = llbind.$scope;
    //创建数据监听
    function createWatch(obj, set) {
        $$watchers.push({
            last: obj.obj[obj.key],
            get: function () {
                return obj.obj[obj.key];
            },
            exp: function () {
                return this.get() === this.last;
            }, set: set,
            setLast: function () {
                let next = $$watchers[this.index + 1];
                if (next.get() == this.last) {
                    next.last = this.last;
                    return next.setLast();
                }
            },
            index: $$watchers.length
        })
    }

    function createWatchCollection(obj, set) {
        var newValue, oldValue = obj.obj[obj.key],
            internalArray = [];
        $$watchers.push({
            get: function () {
                return obj.obj[obj.key];
            },
            exp: function () {
                newValue = this.get();
                if (typeof oldValue != 'object')return newValue===oldValue;
                return forOf(newValue, function (v, i) {
                    if (v !== oldValue[i]) {
                        oldValue = newValue;
                        return false;
                    }
                })
            },
            set: function (v) {
                console.log(v);
            }
        })
    }

    //判断并处理数据变化
    function eachTexts() {
        let $scope = llbind.$scope;//let $scope=scope || llbind.$scope;
        do {
            let watchers = $scope.$$watchers;
            forOf(watchers, function (w) {
                if (!w.exp()) {
                    w.set(w.get());
                }
            })

            let childScope = $scope.$childHeadScope,
                nextScope = $scope.$nextScope;
            if (childScope)
                $scope = childScope;
            else if (nextScope)
                $scope = nextScope;
            else {
                while (!nextScope && $scope !== llbind.$scope) {
                    $scope = $scope.$parentScope;
                    nextScope = $scope.$nextScope;
                }
                $scope = nextScope;
            }
        } while ($scope);
    }

    //初始化解析
    function eachText(elem) {
        let childs = elem.childNodes,
            watchers = llbind.$scope.$$watchers,
            child, textContent, templateReg = /(?={{).+}}/,
            resolve;
        forOf(childs, function (child) {
            switch (child.nodeType) {
                case NODE_TYPE_TEXT:
                    textContent = child.textContent;
                    if (templateReg.test(textContent)) {
                        child.textContent = resolveText(textContent, child);
                    }
                    break;
                case NODE_TYPE_ELEMENT:
                    if (!resolveAttr(child))
                        eachText(child);
                    break;
                default:
                    eachText(child);
            }
        });
    }

    //解析花括号
    function resolveText(text, elem, key) {
        let m = text.match(/(?={{)(.+?)}}/g);
        let attr, value, oldresolve = text, resolveObject;
        forOf(m, (v) => {
            attr = v.match(/[^{^}]+/)[0];
            value = objectGetValue(attr) || '';
            resolveObject = getObject(attr);
            if (elem) {
                createWatch(getObject(attr), function (v) {
                    let value = resolveText(oldresolve);
                    switch (elem.nodeType) {
                        case NODE_TYPE_TEXT:
                            elem.textContent = value;
                            break;
                        case NODE_TYPE_ELEMENT:
                            elem.setAttribute(key, value);
                            break;
                    }
                    this.last = v;
                    this.setLast();
                })
            }
            text = text.replace(v, value);
        })
        return text;
    }

    //解析属性
    function resolveAttr(elem) {
        let isFor = false;
        let attrkey, attrvalue, text, templateReg = /(?={{).+}}/;
        forOf(elem.attributes, function (v) {
            attrkey = v.name;
            text = v.value;
            /*if(attrkey==='ll-for'){
                addllFors(elem,text);
                isFor=true;
                return false;
            }*/
            if (templateReg.test(text)) {
                attrvalue = resolveText(text, elem, attrkey);
                elem.setAttribute(attrkey, attrvalue);
            }
        })
        return isFor;
    }

    //初始化循环解析
    function eachFors(elem, asName, asObj) {
        /*if(elem.nodeType===NODE_TYPE_ELEMENT){
            forOf(elem.attributes,function(v){
                //attrkey
            })
        }*/
    }

    //添加循环解析
    function addllFors() {
        let for_doms = document.querySelectorAll('[ll-For]');
        forOf(for_doms, function (for_dom) {
            var attrValue = for_dom.getAttribute('ll-for');
            let match = attrValue.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+of\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
            let fordom = for_dom.cloneNode(true);
            let object = {
                fhs: match[0],
                lhs: match[1],
                rhs: match[2],
                askey: match[3],
                fordom: fordom
            };
            let forComment = createComment("llFor", object.fhs);
            elemAddBefore(for_dom, forComment);
            //let val=$scope.$forScope[lhs]=object.obj[object.key];
            llFors[forComment.textContent] = object;
            for_dom.remove();
            /*if(!val)return;
            for(var i = 0; i<val.length;i++){
                elemAddAfter(forComment,fordom);
                elemAddAfter(fordom,createComment("end llFor",fhs));
                fordom=fordom.cloneNode(true);
            }*/
        })
    }

    function resolveFor() {
        forOf(llFors, function (resolveObject) {
            let lhs = resolveObject.lhs, rhs = resolveObject.rhs;
            createWatch(getObject(rhs), function (v) {
                console.log(v);
            });
        })
        /*let resolveObject=llFors[comment.textContent],
            val=getObject(resolveObject.rhs,$currentScope),
            fordom=resolveObject.fordom.cloneNode(true),
            lhs=resolveObject.lhs,rhs=resolveObject.rhs;
        fordom.removeAttribute('ll-for');
        forOf(val.obj[val.key],function(v,i){
            elemAddAfter(comment,fordom);
            elemAddAfter(fordom,createComment("end llFor",resolveObject.fhs));
            let temp=fordom;
            fordom=temp.cloneNode(true);
            eachText(temp,lhs,rhs+'['+i+']');
        });*/
    }


    //解析对象 
    function objectGetValue(o, s) {
        if (typeof o !== 'string') return null;
        let attr = o.split('.'),
            arrReg = /([^\[]+)\[(\d)\]/;
        let $scope = s || llbind.$scope;
        forOf(attr, function (v, i) {
            let k = v.match(arrReg);
            if (k) {
                $scope = $scope[k[1]][k[2]];
            } else {
                $scope = $scope[v];
            }
            if (typeof $scope === "undefined" || $scope === null) return null;
        })
        return $scope || '';
    }

    //通过字符串设置对象属性值
    function objectSetValue(o, val, s) {
        if (typeof o !== 'string') return null;
        let attr = o.split('.'),
            arrReg = /([^\[]+)\[(\d)\]/,
            attrLength = attr.length;
        let $scope = s || llbind.$scope;
        forOf(attr, function (v, i) {
            let k = v.match(arrReg);
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
        })
        return $scope;
    }

    //获取对象
    function getObject(o, s) {
        if (typeof o !== 'string') return null;
        let attr = o.split('.'), obj = null,
            arrReg = /([^\[]+)\[(\d)\]/,
            attrLength = attr.length;
        let $scope = s || llbind.$scope;
        forOf(attr, function (v, i) {
            let k = v.match(arrReg);
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
        })
        return obj;
    }

    gb.bootEach = function (App) {
        addllFors();
        llbind.$bind();
        eachText(App);
        resolveFor();
        eachTexts();
    };

    window.addEventListener('load', function () {
        bootEach(document.querySelector('[ll-app]'));
    });
    gb.llbind = llbind;
    gb.eachTexts = eachTexts;
})(window);