(function(gb){
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
        t=t||this;
        for (var k in o) {
            if (!o.hasOwnProperty(k) || fn.call(t,o[k],k) == false)break;
        }
    }

//
var NODE_TYPE_TEXT = 3;
var NODE_TYPE_ELEMENT = 1;

    let lbind={
        $bind:function(){
            this.$event();
            this.$lmodel();
        },
        $event:function(){
            let levent_dom=document.querySelectorAll('[levent]'),
                _this=this;
            forOf(levent_dom,function(v){
                let attrs=v.getAttribute('levent').split('&');
                for(let attr of attrs){
                    let events=attr.split(":")[0].split("~"),
                        fn=attr.split(":")[1],
                        fnName=fn.match(/([\w\d]+)\(/)[1],
                        args=fn.match(/\(([^\)]+)\)/);
                    if(args)args=args[1].split(",");
                    v.removeAttribute('levent');
                    for(let event of events){
                        v.addEventListener(event,function(e){
                            for(let i in args){
                                let arg=args[i];
                                if(arg==="$event"){
                                    args[i]=e;
                                    continue;
                                }
                                if(!isNaN(parseInt(arg))){
                                    args[i]=parseInt(arg);
                                    continue;
                                }

                                if(!/^['"]/.test(arg)){
                                    let bindval=objectGetValue(arg);
                                    if(bindval)args[i]=bindval;
                                }else{
                                    args[i]=arg.replace(/^['"]/,'').replace(/['"]$/,'');
                                }
                            }
                            let fnReturn=_this.$scope[fnName].apply(this,args);
                            eachTexts(this);
                            return fnReturn;
                        });
                    }
                }
            });
            
        },
        $lmodel:function(){
            let lmodel_dom=document.querySelectorAll('[lmodel]'),
                _this=this,
                inps=this.$elems.inps,
                watchers=this.$scope.$$watchers;
            forOf(lmodel_dom,function(v){
                let attr=v.getAttribute('lmodel');
                let wobj=getObject(attr);
                console.log(wobj);
                watchers.push({
                    last:v.value=objectGetValue(attr),
                    elem:v,
                    reg:attr,
                    obj:wobj,
                    get:function(){
                        let obj=this.obj;
                        return obj.obj[obj.key];
                    },
                    set:function(v){
                        this.last=this.elem.value=v;
                    }
                })
                v.addEventListener('input',function(){
                    wobj.obj[wobj.key]=this.value;
                    var DateTime=Date.now();
                    eachTexts(this);
                    console.log(Date.now()-DateTime);
                });
            });
        },
        $lFor:function(){

        },
        $scope:{
            $$watchers:[]
        },
        $elems:{
            texts:[],
            inps:[],
            attrs:[]
        }
    }

    let $$watchers=lbind.$scope.$$watchers;

    //创建数据监听
    function createWatch(elem,last,reg,cureg,obj,key,get,set){
        $$watchers.push({
            elem:elem,last:last,
            reg:reg,cureg:cureg,obj:obj,
            key:key,get:get,set:set,
            setLast:function(){
                let next=$$watchers[this.index+1];
                if(next&&next.cureg===this.cureg&&next.elem===this.elem){
                    next.last=this.last;
                    return next.setLast();
                }
            },
            index:$$watchers.length
        })
    }

    //监听数据变化
    function eachTexts(elem){
        let watchers=lbind.$scope.$$watchers,
            resolvetext;
        forOf(watchers,function(w){
            resolvetext=w.get();
            if(resolvetext!==w.last&&elem!==w.elem){
                w.set(resolvetext);
            }
        })
    }

    //初始化解析
    function eachText(elem){
        let childs=elem.childNodes,
            watchers=lbind.$scope.$$watchers,
            child,textContent,templateReg=/(?={{).+}}/,
            attrkey,attrvalue,resolve;
        forOf(childs,function(child){
            switch(child.nodeType){
                case NODE_TYPE_TEXT:
                    textContent=child.textContent;
                    if(templateReg.test(textContent)){
                        child.textContent=resolveText(textContent,child);
                    }
                    break;
                case NODE_TYPE_ELEMENT:
                    forOf(child.attributes,function(v){
                        textContent=v.value;
                        if(templateReg.test(textContent)){
                            attrkey=v.name;
                            attrvalue=resolveText(textContent,child,attrkey);
                            child.setAttribute(attrkey,attrvalue);
                        }
                    })
                    eachText(child);
                    break;
                default:
                    eachText(child);
            }
        });
    }

    //解析花括号
    function resolveText(text,elem,key){
        let m=text.match(/(?={{)(.+?)}}/g);
        let attr,value,oldresolve=text;
        forOf(m,(v)=>{
            attr=v.match(/[^{^}]+/)[0];
            value=objectGetValue(attr)||'';
            if(elem){
                createWatch(elem,value,oldresolve,v,getObject(attr),key,function(){
                    let so=this.obj;
                    return so.obj[so.key];
                },function(v){
                    let elem=this.elem,value=resolveText(this.reg);
                    switch (elem.nodeType){
                        case NODE_TYPE_TEXT:
                            elem.textContent=value;
                            break;
                        case NODE_TYPE_ELEMENT:
                            elem.setAttribute(this.key,value);
                            break;
                    }
                    this.last=v;
                    this.setLast();
                })
            }
            text=text.replace(v,value);
        })
        return text;
    }

    //解析对象 
    function objectGetValue(o){
        if(typeof o !== 'string')return null;
        let attr=o.split('.'),
        arrReg=/([^\[]+)\[(\d)\]/;
        let $scope=lbind.$scope;
        forOf(attr,function(v,i){
            let k = v.match(arrReg);
            if(k){
                $scope=$scope[k[1]][k[2]];
            }else{
                $scope=$scope[v];
            }
            if(typeof $scope==="undefined"||$scope===null)return null;
        })
        return $scope||'';
    }

    //通过字符串设置对象属性值
    function objectSetValue(o,val){
        if(typeof o !== 'string')return null;
        let attr=o.split('.'),
        arrReg=/([^\[]+)\[(\d)\]/,
        attrLength=attr.length;
        let $scope=lbind.$scope;
        forOf(attr,function(v,i){
            let k = v.match(arrReg);
            if(k){
                if(i==attrLength-1){
                    $scope[k[1]][k[2]]=val;
                    return false;
                }
                $scope=$scope[k[1]][k[2]];
            }else{
                if(i==attrLength-1){
                    $scope[v]=val;
                    return false;
                }
                $scope=$scope[v];
            }
        })
        return $scope;
    }

    //获取对象
    function getObject(o){
        if(typeof o !== 'string')return null;
        let attr=o.split('.'), obj=null,
        arrReg=/([^\[]+)\[(\d)\]/,
        attrLength=attr.length;
        let $scope=lbind.$scope;
        forOf(attr,function(v,i){
            let k = v.match(arrReg);
            if(k){
                if(i==attrLength-1){
                    obj={obj:$scope[k[1]],key:k[2]};
                    return false;
                }
                $scope=$scope[k[1]][k[2]];
            }else{
                if(i==attrLength-1){
                    obj={obj:$scope,key:v};
                    return false;
                }
                $scope=$scope[v];
            }
        })
        return obj;
    }
    
    gb.bootEach=function(App){
        eachText(App);
        lbind.$bind();
    };
    gb.lbind=lbind;
    gb.eachTexts=eachTexts;
})(window);