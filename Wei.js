(function (loaderName){ 
	window[loaderName]=function(theme){
		
	};
	var object = window[loaderName];
	
	object.classContainer={}; 
//配置相应的路径   
    object.classContextPath = "http://127.0.0.1:8020/lod";
	var fn = {};   
	function getJavaScript(className,afterload){ 
		var classPath = className.replace(new RegExp(/(\.)/g), "/");
//		alert(object.classContextPath+"/"+classPath+".js")
		$.ajax({
			url:object.classContextPath+"/"+classPath+".js",
			type:'get',
			cache:false,
			dataType:'script', 
			error:function(){ 
				console.error(className+" is not exsit!");
				afterload(null);
			},
			success:afterload
		});  
	}
	
	fn.importClass=function(classArray, afterload){
		console.log(classArray)
		var object = this; 
		if(!classArray||classArray.length==0){
			afterload();
		}else{	
			if(typeof(classArray) ==="String"){ 
				classArray=[classArray];
			}  
			var length = classArray.length;
			classArray.forEach(function(clazzName){
				loadClass(clazzName,function(clazz){		 
					length--; 
					if(length==0){
						afterload();
					} 
				})
			});
		}   
	} 
	
	
	function makeClass(classConfig){
		var clazz=function(){
			invoke(this,arguments); 
		} 
		var classInfo = {}; 
		if(typeof(classConfig)=="string"){ 
			classInfo["name"] = classConfig; 
			classInfo["load"] = false;
		}else{
			classInfo["name"] = classConfig["name"];
			classInfo["depends"] = classConfig["depends"];
			classInfo["fn"] = classConfig["fn"];
			classInfo["load"] = true;
		} 
		classInfo["dependClasses"] = [];
		clazz.prototype.classInfo = classInfo;
		object.classContainer[classInfo["name"]]=clazz;
		return clazz;
	}
	
	
	function loadClass(className,afterload){   
		var clazz = object.classContainer[className]; 
		if(!clazz){  
			clazz=makeClass(className); 
			var classInfo = clazz.prototype.classInfo;  
			getJavaScript(className,function(){ 	 
				classInfo.load=true; 
				classInfo.ready=true;  
				var depends = classInfo.depends; 
				if(!depends){  
					afterload(clazz); 
				}else{  
					if(depends.length>0){ 
						object.importClass(depends,function(){  
							var length = depends.length;  
							depends.forEach(function(depend){ 
								loadClass(depend,function(dependClass){  
									classInfo["dependClasses"].push(dependClass);
									if(--length == 0){
										afterload(clazz);
									}
								});  			
							}); 
						}); 
					}else{
						afterload(clazz);
					}
				}				 
			}); 
		} else{
			afterload(clazz);
		}   
	}
	
	function invoke(currentObject,args){  
		var classInfo = currentObject.__proto__.classInfo;
		if(classInfo){ 
			var clazzFn = classInfo["fn"];  
			var dependClasses = classInfo["dependClasses"];
			var dependLoaded = true;
			dependClasses.forEach(function(dependClass){
				if(!dependClass){
					clazzFn=null;
					console.error(dependClass["name"]+" is undefined!");
				}
			}); 
			if(clazzFn){
				clazzFn.apply(currentObject,args);
			}
		}   
	}
   
	fn.define = function(classConfig){  
		var clazz=this.classContainer[classConfig["name"]];  
		if(!clazz){ 
            clazz=makeClass(classConfig);
		}
		var classInfo = clazz.prototype.classInfo;  
		var classNameArray = classInfo.name.split("."); 
		classInfo['depends'] = classConfig["depends"];
		classInfo['fn'] = classConfig["fn"];
		var length = classNameArray.length;
		var pack = window;  
		for ( var i = 0; i < length; i++) {
			if (i < (length - 1)){
				if (pack[classNameArray[i]]==undefined) {
					pack[classNameArray[i]] = function(){};
				}
				pack = pack[classNameArray[i]];
			} else {
				pack[classNameArray[i]] =clazz;  
			}
		} 
		classInfo.ready=true;
		classInfo.load=true;
	}  
	 
	for(var key in fn){
		object[key] =fn[key];
	}    
	
})("wei");