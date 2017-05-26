(function(gb){
    function forOf(o, fn, t, dc) {
        if (dc)
            o = copyObj(o);
        t=t||this;
        for (var k in o) {
            if (!o.hasOwnProperty(k) || fn.call(t,o[k],k) == false)break;
        }
    }

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
                watchers.push({
                    last:v.value=objectGetValue(attr),
                    elem:v,
                    reg:attr,
                    obj:getObject(attr),
                    get:function(){
                        let obj=this.obj;
                        return obj.obj[obj.key];
                    },
                    set:function(v){
                        this.last=this.elem.value=v;
                    }
                })
                v.addEventListener('input',function(){
                    objectSetValue(attr,this.value);
                    var DateTime=Date.now();
                    eachTexts(this);
                    console.log(Date.now()-DateTime);
                });
            });
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

    function eachTexts(elem){
        let watchers=lbind.$scope.$$watchers,
            resolvetext;
        for(let w of watchers){
            resolvetext=w.get();
            if(resolvetext!==w.last&&elem!==w.elem){
                w.set(resolvetext);
            }
        }
    }

    function eachText(elem){
        let childs=elem.childNodes,
            watchers=lbind.$scope.$$watchers,
            child,textContent,templateReg=/(?={{).+}}/,
            attrkey,attrvalue,resolve;
        for(let i=0;i<childs.length;i++){
            child=childs[i];
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
        }
    }

    function resolveText(text,elem,key){
        let m=text.match(/(?={{)(.+?)}}/g);
        let attr,value,oldresolve=text;
        for(let v of m){
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
        }
        return text;
    }

    function objectGetValue(o){
        if(typeof o !== 'string')return null;
        let attr=o.split('.');
        let val=lbind.$scope[attr[0]];
        for(let i in attr){
            if(typeof val==='undefined'||val===null)return null;
            if(i>0){
                val=val[attr[i]];
            }
        }
        return val||'';
    }

    function objectSetValue(o,v){
        if(typeof o !== 'string')return null;
        let attr=o.split('.');
        let val=lbind.$scope[attr[0]];
        if(typeof val!=='object'){
            lbind.$scope[attr[0]]=v;
            return true;
        }
        for(let i in attr){
            if(i>0){
                let obj=val[attr[i]];
                if(typeof obj!=='object'){
                    val[attr[i]]=v;
                    return true;
                }else{
                    val=obj;
                }
            }
        }
        return false;
    }

    function getObject(o){
        if(typeof o !== 'string')return null;
        let attr=o.split('.'), obj;
        let val=lbind.$scope[attr[0]];
        if(typeof val!=='object'){
            return {obj:lbind.$scope,key:attr[0]};
        }
        for(let i in attr){
            if(i>0){
                obj=val[attr[i]];
                if(typeof obj!=='object'){
                    return {obj:val,key:attr[i]};
                }else{
                    val=obj;
                }
            }
        }
        return null;
    }
    
    gb.bootEach=function(App){
        eachText(App);
        lbind.$bind();
    };
    gb.lbind=lbind;
    gb.eachTexts=eachTexts;
})(window);