(function(gb){
    function forOf(o, fn, t, dc) {
        if (dc)
            o = copyObj(o);
        t=t||this;
        for (var k in o) {
            if (!o.hasOwnProperty(k) || fn.call(t,o[k],k) == false)break;
        }
    }

var NODE_TYPE_TEXT=3;
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
                //inps.push({$elem:v,$model:attr});
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


    function eachTexts(elem){
        let watchers=lbind.$scope.$$watchers,
            resolvetext;
        for(let w of watchers){
            resolvetext=w.get();
            if(resolvetext!==w.last&&elem!==w.elem){
                w.set(resolvetext);
            }
        }
        /*let $elems=lbind.$elems,
            texts=$elems.texts,
            inps=$elems.inps,
            attrs=$elems.attrs;
        let element,resolvetext,
            key,value;
        for(let text of texts){
            resolvetext=resolveText(text.$text);
            element=text.$elem;
            if(element.textContent!=resolvetext)
                element.textContent=resolvetext;
        }
        for(let inp of inps){
            element=inp.$elem;
            resolvetext = objectGetValue(inp.$model);
            if(element.value!==resolvetext&&element!==elem){
                element.value=resolvetext;
            }
        }
        for(let attr of attrs){
            element=attr.$elem;
            key=attr.$attrkey;
            resolvetext = resolveText(attr.$attrvalue);
            if(element.getAttribute(key)!==resolvetext){
                element.setAttribute(key,resolvetext);
            }
        }*/
    }

    function eachText(elem){
        let childs=elem.childNodes,
            watchers=lbind.$scope.$$watchers,
            //$texts=lbind.$elems.texts,
            //$attrs=lbind.$elems.attrs,
            child,textContent,templateReg=/(?={{).+}}/,
            attrkey,attrvalue,resolve;
        for(let i=0;i<childs.length;i++){
            child=childs[i];
            switch(child.nodeType){
                case NODE_TYPE_TEXT:
                    textContent=child.textContent;
                    if(templateReg.test(textContent)){
                        //$texts.push({$elem:child,$text:textContent});
                        resolve=resolveText(textContent);
                        watchers.push({
                            last:child.textContent=resolve.text,
                            elem:child,
                            reg:textContent,
                            obj:resolve.objs,
                            get:function(){
                                return resolveText(this.reg,this.obj);
                            },
                            set:function(v){
                                this.last=this.elem.textContent=v;
                            }
                        })
                        
                    }
                    break;
                case NODE_TYPE_ELEMENT:
                    forOf(child.attributes,function(v){
                        textContent=v.value;
                        if(templateReg.test(textContent)){
                            attrkey=v.name;
                            resolve=resolveText(textContent);
                            attrvalue=resolve.text;
                            watchers.push({
                                last:attrvalue,
                                elem:child,
                                key:attrkey,
                                reg:textContent,
                                obj:resolve.objs,
                                get:function(){
                                    return resolveText(this.reg,this.obj);
                                },
                                set:function(value){
                                    this.elem.setAttribute(this.key,this.last=value);
                                }                     
                            })
                            /*$attrs.push({
                                $elem:child,
                                $attrkey:attrkey,
                                $attrvalue:textContent
                            })*/
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

    function resolveText(text,object){
        let m=text.match(/(?={{)(.+?)}}/g);
        let arr=[],obj;
        if(object){
            for(let o in object){
                obj=object[o];
                text=text.replace(m[o],obj.obj[obj.key]||'');
            }
            return text;
        }
        for(let v of m){
            let attr=v.match(/[^{^}]+/)[0];
            arr.push(getObject(attr));
            text=text.replace(v,objectGetValue(attr)||'');
        }
        return {text:text,objs:arr};
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
    
    gb.eachText=eachText;
    window.onload=function(){
        lbind.$bind();
    }
    gb.lbind=lbind;
    gb.eachTexts=eachTexts;
})(window);