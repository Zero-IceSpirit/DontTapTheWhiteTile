/*————拓展1，DOM相关操作————*/

//——获取页面可视区域宽度——//
function getClientWidth(){
	return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth;
};

//——获取页面可视区域高度——//
function getClientHeight(){
	return window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight;
};


/*————拓展2，数据存储相关————*/

//——验证数据是否有值——//
function isset (val){
	return !(val === undefined || val === null);
};

//——设置本地存储——//
function setLocalStorage (key, value){
	if(!localStorage)return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (e) {
		console.log(e);
		return false;
	}
};

//——获取本地存储——//
function getLocalStorage (key, defaultValue) {
	if(!localStorage)return defaultValue;
	var value = localStorage.getItem(key);
	if(this.isset(value)) return JSON.parse(value);
	return defaultValue;
};

//——移除本地存储——//
function removeLocalStorage (key) {
	if(!localStorage)return;
	return localStorage.removeItem(key);
};

//——清空本地存储——//
function clearLocalStorage () {
	if(!localStorage)return;
	return localStorage.clear();
};

//——深拷贝一个对象**有争议——//
/*//不确定是否要使用以前的copy方式，因为他用的方式是完全重新拷贝（所有数据重设），若数据过大可能会导致卡顿？但……似乎也没差了。有时间再完成以前的方式吧。
function deepClone(data, copy, reset){};
*/
function deepClone(data) {
	if (!isset(data)) return data;
	// date
	if (data instanceof Date) {
		var copy = new Date();
		copy.setTime(data.getTime());
		return copy;
	}
	// array
	if (data instanceof Array) {
		var copy=[];
		for (var i in data) {
			copy[i] = deepClone(data[i]);
		}
		return copy;
	}
	// 函数
	if (data instanceof Function) {
		return data;
	}
	// object
	if (data instanceof Object) {
		var copy={};
		for (var i in data) {
			if (data.hasOwnProperty(i))
				copy[i]=deepClone(data[i]);
		}
		return copy;
	}
	return data;
};


/*————拓展3，Canvas支持增强————*/

//——设置Canvas的宽高——//
HTMLCanvasElement.prototype.setCanvasSize = function (width, height, callback){
	var canvas = this;
	canvas.width=width || canvas.width; //若数据错误则不进行变动
	canvas.height=height || canvas.height;
	if(callback)return callback(); //返回callback返回内容
};

//——设置Canvas的宽高，自主传参canvas——//
function setCanvasSize (canvas, width, height, callback){
	canvas.width = width || canvas.width; //若数据错误则不进行变动
	canvas.height = height || canvas.height;
	if(callback)return callback(); //返回callback返回内容
};

//——Canvas2D绘制圆角矩形——//
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r, drawMode) {
	var min_size = Math.min(w, h), that = this;
	if (r > min_size / 2) r = min_size / 2;
	// 开始绘制
	that.beginPath();
	that.moveTo(x + r, y);
	that.arcTo(x + w, y, x + w, y + h, r);
	that.lineTo(x + w, y + r);
	that.arcTo(x + w, y + h, x, y + h, r);
	that.lineTo(x + w - r, y + h);
	that.arcTo(x, y + h, x, y, r);
	that.lineTo(x, y + h - r);
	that.arcTo(x, y, x + w, y, r);
	that.closePath();
	!drawMode||that[drawMode]();
	return that;
};

//——Canvas2D文本自动换行绘制**待完成，目前该代码不是主要要求内容——//
//CanvasRenderingContext2D.prototype.TextAutoLine = function ()


/*————拓展4，其他————*/

//——兼容animation——//
!function(){
	var lastTime = 0;
	var vendors = ['webkit', 'moz', 'ms'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // Webkit中此取消方法的名字变了
		window[vendors[x] + 'CancelRequestAnimationFrame'];
	}
	//若不兼容则使用setTimeout替代
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}();

//——数组数值排序——//
function sortNumber(a,b){
	return b - a;
}

//待确认——保存图片功能，目前用新页面打开
//window.open('about:blank','image').document.write("<title>请保存图片</title><h1>可保存该图片，本页面不消耗流量</h1><img src='"+canvas.toDataURL("image/png")+"' alt='炫耀'/>");
















