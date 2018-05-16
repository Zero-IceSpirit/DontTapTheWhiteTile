game.prototype = {
	////游戏内容初始化////
	init : function() {
		this._prepareAPI(); //部分数据预处理
		this._addEventListner(); //事件监听
		this.getScroll(); //获取并预置页面滚动条属性
		this.resize(); //获取并预置样式数据
		/*测试代码*/
		this.initGameData();
		/*测试代码结束*/
		this.main(); //执行游戏循环
		this.drawTip("已载入");
	},
	////准备API和环境////
	_prepareAPI : function() {
		var that = this;
		//准备canvas对象与2d操作环境对象
		var cid = that.cid;
		that.canvas = document.getElementById(cid);
		that.c2d = that.canvas.getContext("2d");
		//积分与设置数据加载与初始化
		that.score.coin = that.score.coin || 0; //音符货币
		that.flags.language = that.flags.language || "zh-cn";
		that.flags.sound = that.flags.sound || 0;
		that.score.bestScore = {};
		that.score.gamesPlayed = {};
		that.score.tilesCollected = {};
		for(var i in that.rule){ //各模式需记录的数据
			that.score.bestScore[i] = [];
			that.score.gamesPlayed[i] = [];
			that.score.tilesCollected[i] = [];
			that.flags.lastMode[i] = 0;
			for(var l in that.rule[i].sub){
				that.score.bestScore[i][l] = 0;
				that.score.gamesPlayed[i][l] = 0;
				that.score.tilesCollected[i][l] = 0;
			}
		}
		that.score.leaderboard = {arcade:new Array(5), rush:new Array(5)};
		//积分与设置数据加载
		that.load();
		//Dom页面预设
		that.dom.dReturn.onclick = function(){that.tolastDomPage()}; //dom页面返回按钮
		that.dom.dReset.onclick = function(){that.resetSave()}; //dom页面重置按钮
		//——音频播放方式决定与预处理——//
		window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext; //兼容早期浏览器
		try { // 检测是否支持audioContext，若不支持则告知用户
            that.audioContext = new AudioContext();
        } catch (e) {
            console.log(e+"\n!Your browser does not support AudioContext");
        }
		//若为本地连接，则不使用audioContext
		if(window.location.href.slice(0,5) == "file:"){that.audioContext = null;}
		//根据audioContext支持状态决定数据读取方式
		var audioSrc;
		if(that.audioContext){ //支持audioContext且非本地url
			var audioCtx = that.audioContext, sound;
			function loadSound(sound, url) { //读取音频文件
				var request = new XMLHttpRequest(); //建立一个请求
				request.open('GET', url, true); //配置好请求类型，文件路径等
				request.responseType = 'arraybuffer'; //配置数据返回类型
				// 一旦获取完成，对音频进行进一步操作，比如解码
				request.onload = function() {
					sound.file = request.response;
					audioCtx.decodeAudioData(sound.file, function(buffer){
						sound.buffer = buffer;
					}, function(e) {console.log("音频文件解码失败：(")});
				}
				request.send();
			}
			for(var i in that.sound){ //使用XMLHttpRequest获取音频文件
				audioSrc = that.sound[i];
				that.sound[i] = {};
				sound = that.sound[i];
				loadSound(sound, audioSrc);
			}
		}else{ //使用audio进行兼容播放
			for(var i in that.sound){ //读取连接并将其变更为audio对象
				audioSrc = that.sound[i];
				that.sound[i] = {};
				that.sound[i].audio = new Audio();
				that.sound[i].audio.src = audioSrc;
				//如果为本地连接则不使用audioContext
			}
		}
		
	},
	
	////事件监听////
	_addEventListner : function(){
		var that = this,
		canvas = that.canvas,
		dom = that.dom,
		state = that.state,
		eventState = that.eventState,
		handlers = that.handlers;
		
		//页面大小变更与滚动滑块后预设状态
		handlers.resize = function(){state.resize = true;};
		handlers.onscroll = function(){state.onscroll = true;};
		//鼠标||触控属性预设
		handlers.setClickMsg = function(eName,e){
			e = e || event;
			e.preventDefault();
			if(eName.slice(0,5) === "mouse"){ //鼠标消息
				if(!eventState[eName]){eventState[eName] = [];eventState[eName][0] = {};};
				eventState[eName][0].clientX = that.getClientX(e.clientX);
				eventState[eName][0].clientY = that.getClientY(e.clientY);
				state[eName] = true;
			}else{ //触控消息
				if(!eventState[eName]){eventState[eName] = []
				}else{eventState[eName].splice(0,eventState[eName].length);};
				var touches = e.changedTouches;
				for(var i = 0;i<touches.length;i++){
					if(!eventState[eName][i])eventState[eName][i] = {};
					eventState[eName][i].clientX = that.getClientX(touches[i].clientX);
					eventState[eName][i].clientY = that.getClientY(touches[i].clientY);
				};
				state[eName] = true;
			};
		};
		
		handlers.mousedown = function(e){ //鼠标按下
			var eName = "mousedown";
			handlers.setClickMsg(eName, e);
		};
		handlers.mouseup = function(e){ //鼠标弹起
			var eName = "mouseup";
			handlers.setClickMsg(eName, e);
		};
		handlers.mousemove = function(e){ //鼠标移动
			var eName = "mousemove";
			handlers.setClickMsg(eName, e);
		};
		handlers.touchstart = function(e){ //触摸按下
			var eName = "touchstart";
			handlers.setClickMsg(eName, e);
		};
		handlers.touchend = function(e){ //触摸弹起
			var eName = "touchend";
			handlers.setClickMsg(eName, e);
		};
		handlers.touchmove = function(e){ //触摸移动
			var eName = "touchmove";
			handlers.setClickMsg(eName, e);
		};
		
		window.addEventListener("resize", handlers.resize, false);
		window.addEventListener("scroll", handlers.onscroll, false);
		canvas.addEventListener("mousedown", handlers.mousedown, false);
		canvas.addEventListener("mousemove", handlers.mousemove, false);
		canvas.addEventListener("mouseup", handlers.mouseup, false);
		canvas.addEventListener("touchstart", handlers.touchstart, false);
		canvas.addEventListener("touchmove", handlers.touchmove, false);
		canvas.addEventListener("touchend", handlers.touchend, false);
	},
	
	////获取当前成绩////
	getCurrScore : function(){
		var that=this, b=that.b, bestScore=Number(that.score.bestScore[b.mode][b.sub]), currScore=b.run.currScore, run=b.run,
		language = that.language[that.flags.language],
		TitleList = {best:language.best, newBest:language.newBest, failed:language.failed};
		switch(run.rule.tip){ //根据提示类型决定内容
			case "playTime": //消耗时间（比短）
				currScore.score = run.score<run.rule.max ? TitleList.failed : (run.time.currRun/1000).toFixed(3) + that.language.misc.symbol[1];
				if(run.score>=run.rule.max && (bestScore==0 && run.time.currRun!=0 || bestScore!=0 && run.time.currRun<bestScore)){currScore.scoreTip = TitleList.newBest;
				}else{currScore.scoreTip = TitleList.best + that.language.misc.symbol[4] + (bestScore/1000).toFixed(3) + that.language.misc.symbol[1];};
				break;
			case "timeLeft": case "block": //点击块数（比多）
				currScore.score = run.score.toString();
				if(bestScore<run.score){currScore.scoreTip = TitleList.newBest;
				}else{currScore.scoreTip = TitleList.best + that.language.misc.symbol[4] + bestScore.toString()};
				break;
			case "speed": //滚屏速度（比快）
				currScore.score = run.speed.toFixed(3) + that.language.misc.symbol[2];
				if(bestScore<run.speed){currScore.scoreTip = TitleList.newBest;
				}else{currScore.scoreTip = TitleList.best + that.language.misc.symbol[4] + bestScore.toFixed(3) + that.language.misc.symbol[2]};
				break;
		};
	},
	
	////结算数据////
	summary : function () {
		//预置参数
		var that=this, b=that.b, run=b.run, mode=b.mode, sub=b.sub,
		bestScore=Number(that.score.bestScore[b.mode][b.sub]);
		that.getCurrScore()//获取成绩
		//判断是否替换该模式成绩
		switch(run.rule.tip){
			case "playTime": //消耗时间（比短）
				if(run.score>=run.rule.max && (bestScore==0 && run.time.currRun!=0 || bestScore!=0 && run.time.currRun<bestScore))that.score.bestScore[mode][sub] = run.time.currRun;
				break;
			case "timeLeft": case "block": //点击块数（比多）
				if(bestScore<run.score)that.score.bestScore[mode][sub] = run.score; break;
			case "speed": //滚屏速度（比快）
				if(bestScore<run.speed)that.score.bestScore[mode][sub] = run.speed; break;
		};
		//该模式游戏次数增加
		that.score.gamesPlayed[mode][sub] = parseInt(that.score.gamesPlayed[mode][sub])+1;
		//该模式踩块数增加
		that.score.tilesCollected[mode][sub] = parseInt(that.score.tilesCollected[mode][sub])+run.score;
		//判断是否需要替换排行榜数据
		switch(mode){
			case "arcade": //街机模式
				that.score.leaderboard.arcade.push(run.score);
				that.score.leaderboard.arcade.sort(sortNumber);
				that.score.leaderboard.arcade.pop();
				break;
			case "rush": //竞速模式
				that.score.leaderboard.rush.push(run.speed);
				that.score.leaderboard.rush.sort(sortNumber);
				that.score.leaderboard.rush.pop();
				break;
		}
		//将积分增加到已有货币
		that.score.coin = parseInt(that.score.coin) + run.score;
		//保存当前子模式
		that.flags.lastMode[mode] = sub;
		
		//删除数据
		that.rerun();
		//数据存档
		that.save()
	},
	
	////数据存档////
	save : function () {
		this.saveFile("score", this.score);
		this.saveFile("flags", this.flags);
	},
	
	////数据加载////
	load : function () {
		this.score = this.loadFile("score", this.score);
		this.flags = this.loadFile("flags", this.flags);
		//加载后检测是否存在旧版遗留数据
		var that = this;
		if(that.score.tilesColected){ //如果存在写错的数据
			//删除该数据
			delete(that.score.tilesColected);
			if(!that.score.tilesCollected){ //检测新数据是否存在，不存在则创建
				that.score.tilesCollected = {};
				for(var i in that.rule){
					that.score.tilesCollected[i] = [];
					for(var l in that.rule[i].sub) that.score.tilesCollected[i][l] = 0;
				}
			}
			that.save();
		}
	},
	
	////存储本地数据////
	saveFile : function (key, value) {
		return setLocalStorage(this.name + "_" + key, value);
	},
	////读取本地数据////
	loadFile : function (key, defaultValue) {
		return getLocalStorage(this.name + "_" + key, defaultValue);
	},
	////删除本地数据////
	removeFile : function (key) {
		return removeLocalStorage(this.name + "_" + key);
	},
	////清空本地数据////
	clearFile : clearLocalStorage,
	
	////绘制小提示////
	drawTip : function(text) {
		var that = this,
		tip = that.logList.tip;
		//检测是否需要更新绘制内容
		if(text){
			tip.text = text;
			tip.hideFrame = that.style.tip.hideFrame;
		};
		//如果存在数据则绘制
		if(tip.text){
			var width = that.dom.width,
			c2d = that.c2d,
			tipStyle = that.style.tip,
			hideFrame = tip.hideFrame,
			alpha = hideFrame>18?1:hideFrame/18,
			color = {
				bg : "rgba("+tipStyle.color.bg+"," + alpha*0.9 +")",
				text : "rgba("+tipStyle.color.text+"," + alpha +")"
			},
			boxWidth, boxHeight;
			
			c2d.font = tipStyle.font;
			c2d.textAlign = "left";
			c2d.textBaseline = "top";
			
			boxHeight = tipStyle.fontSize + tipStyle.top*2.5;
			boxWidth = c2d.measureText(tip.text).width + tipStyle.left*2;
			
			c2d.fillStyle = color.bg;
			c2d.fillRect(tipStyle.left, tipStyle.top, boxWidth, boxHeight);
			c2d.fillStyle = color.text;
			c2d.fillText( tip.text, tipStyle.fontLeft, tipStyle.fontTop);
			
			tip.hideFrame = Math.max(0,hideFrame-1);
			if(tip.hideFrame <= 0)tip.text = ""; //若已显示完毕，则重置text内容
		};
	},
	
	////设置各界面样式数据////
	setPageData : function(pageName) {
		var that = this, p,
		pageData = that.pageData,
		language = that.language[that.flags.language],
		dom = that.dom,
		width = dom.width,
		height = dom.height,
		block = that.b.run.rule.block || 4,
		style = that.style;
		
		//模式菜单页面数据预置
		p = "menu";
		if(!pageName || pageName === p){
			if(!pageData[p])pageData[p] = {};
			//获取按钮语言文本（后续会根据文本数据进行绘制）
			pageData[p].TitleList = [];
			for(var i in language.modeList){ //添加模式文本
				if(language.modeList.hasOwnProperty(i))
					pageData[p].TitleList.push(language.modeList[i][0]);
			};
			pageData[p].TitleList.length % 2 || pageData[p].TitleList.push(language.randomMode); //如果模式不为单数则加个随机按钮凑为单数
			pageData[p].TitleList.push(language.settings); //设置文本
			//设置字体
			if(style[p].font)that.autoFontStyle(pageData[p], style[p].font);
			//设置元素位置
			if(style[p].e)that.autoElementStyle(pageData[p], style[p].e);
		};
		
		//游戏页面数据预置
		p = "game";
		if(!pageName || pageName === p){
			if(!pageData[p])pageData[p] = {};
			//设置文本
			pageData[p].subTitle = {};
			for(var i in language.modeList){ //添加模式文本
				if(language.modeList.hasOwnProperty(i))
					pageData[p].subTitle[i] = language.modeList[i][1];
			};
			pageData[p].startTitle = language.start;
			
			pageData[p].TitleList = { //失败界面文本
				endGame : language.endGame,
				playOn : language.playOn,
				errorTip : language.errorTip,
				best : language.best,
				newBest : language.newBest
			};
			
			//设置字体
			style[p].font.start.size = parseInt(1080 / block / 3);
			if(style[p].font)that.autoFontStyle(pageData[p], style[p].font); 
			//设置元素位置
			style[p].e.blockTip.left = parseInt(1080 / block / 2);
			style[p].e.blockTip.top = parseInt(1920 / block / 2);
			if(style[p].e)that.autoElementStyle(pageData[p], style[p].e);
			//设置block的宽高
			that.b.width = Math.ceil(width / block);
			that.b.height = Math.ceil(height / block);
			
		};
		
		//设置页面数据预置
		p = "settings";
		if(!pageName || pageName === p){
			if(!pageData[p])pageData[p] = {};
			//设置文本
			pageData[p].TitleList = [
				language.back,
				language.leaderboard,
				language.profile,
				language.sound,
				language.language,
				language.about
			];
			pageData[p].soundTitle = language.soundList;
			if(!pageData[p].languageTitle)pageData[p].languageTitle={};
			for(var i =0;i<that.language.list.length;i++){
				pageData[p].languageTitle[that.language.list[i]] = that.language[that.language.list[i]].languageName;
			}
			//设置字体
			if(style[p].font)that.autoFontStyle(pageData[p], style[p].font);
			//设置其他属性
			pageData[p].listNum = pageData[p].TitleList.length;
			pageData[p].row = Math.ceil(pageData[p].listNum/2);
			//设置元素位置
			if(style[p].e)that.autoElementStyle(pageData[p], style[p].e);
		};
		
		//结束界面数据预置
		p = "end";
		if(!pageName || pageName === p){
			if(!pageData[p])pageData[p] = {};
			pageData[p].TitleList = {
				gameName : language.gameName,
				share : language.share,
				exit : language.exit,
				again : language.again,
				best : language.best,
				newBest : language.newBest,
				ver : language.ver
			};
			//设置字体
			if(style[p].font)that.autoFontStyle(pageData[p], style[p].font);
			//设置元素位置
			if(style[p].e)that.autoElementStyle(pageData[p], style[p].e);
		};
		
	},
	
	////设置其他样式数据////
	setMiscStyle : function(){
		var that=this, style=that.style, width=that.dom.width, height=that.dom.height;
		
		//tip相关样式
		if(!style.tip) style.tip= {};
		var tip = style.tip;
		tip.left = parseInt(width * 0.01);
		tip.top = tip.left;
		tip.fontLeft = tip.left*2;
		tip.fontTop = tip.top*2;
		tip.fontSize = parseInt(width / 30);
		tip.font = tip.fontSize+ "px " + style.fontName;
		tip.color = { //因为实际是rgba的数据，所以此处只存储rgb3种颜色的数值
			bg : "34,34,34",
			text : "255,255,255"
		};
		tip.hideFrame = 120; //隐藏的帧数
	},
	
	////设置自适应字体大小////
	autoFontStyle : function(pageData, fontStyle){
		//若原数据不存在font与fontSize属性，则预置
		if(!pageData.font)pageData.font = {};
		if(!pageData.fontSize)pageData.fontSize = {};
		//预获取参数信息
		var scale=this.style.scale.width, fontName=this.style.fontName, fontSize;
		//循环检测并设置属性
		for( var i in fontStyle ){
			if( fontStyle.hasOwnProperty(i) ){
				fontSize = parseInt(fontStyle[i].size * scale);
				pageData.fontSize[i] = fontSize;
				pageData.font[i] = (fontStyle[i].bold?"bold ":"") + fontSize + "px " + fontName;
			}
		}
	},
	
	////设置自适应元素大小////
	autoElementStyle : function(pageData, e){
		//若原数据不存在e属性，则预置
		if(!pageData.e)pageData.e = {};
		//预获取参数信息
		var scaleWidth = this.style.scale.width,
		scaleHeight = this.style.scale.height,
		scale;
		//循环检测并设置属性
		for ( var i in e ){ if ( e.hasOwnProperty(i) ){
			if(!pageData.e[i])pageData.e[i] = {};
			for ( var style in e[i] ) { if ( e[i].hasOwnProperty(style) ){
				switch(style) {
					case "width": case "left": case "fontLeft": case "radius":
						scale = scaleWidth;
						break;
					case "height": case "top": case "fontTop": case "fontTopB":
						scale = scaleHeight;
						break;
					default :
						scale = 1;
						//console.log("非预置自适应样式："+style, e[i][style]);
						break;
				}
				//设置对应属性
				pageData.e[i][style] = Math.ceil(e[i][style] * scale);
			}}
		}}
	},
	
	////获取scroll属性////
	getScroll: function() {
		this.dom.scrollLeft = document.documentElement.scrollLeft;
		this.dom.scrollTop = document.documentElement.scrollTop;
	},
	
	////获取ClientX最终坐标////
	getClientX: function(clientX) {
		return clientX - this.dom.offsetLeft + this.dom.scrollLeft;
	},
	
	////获取ClientY最终坐标////
	getClientY: function(clientY) {
		return clientY - this.dom.offsetTop + this.dom.scrollTop;
	},
	
	////提供两个数值，判断是否在同一列////
	ifOneColumn: function(a ,b){
		if(a == -1 || b== -1)return false;
		if(a == b || a + 2 == b || a - 2 == b)return true;
		return false;
	},
	
	////提供至少两种颜色的数组，和比例位置，返回中间过度色////
	calcMiddleColor: function(colorList, ratio, alpha){
		if(!isset(ratio))ratio = 1;
		var middle = {r:0 ,g:0 ,b:0}, spacing=1/(colorList.length-1), site=0, aColor, bColor, lastRatio = ratio;
		if(lastRatio > 1)lastRatio = (lastRatio % 1 == 0) ? 1 : lastRatio%1;//校正比例数值（数值范围0~1）
		do{ //取最终中间色
			aColor = colorList[site], bColor = colorList[site+1];site++;
			if(site!=1 && spacing<lastRatio)lastRatio=lastRatio-spacing;
		}while(spacing<lastRatio);
		lastRatio = lastRatio / spacing; //纠正比例
		for(var i in middle){ //计算rgb色值
			if(middle.hasOwnProperty(i)){
				if(aColor[i] >= bColor[i]){ middle[i] = aColor[i] - Math.round((aColor[i]-bColor[i])*lastRatio);
				}else{ middle[i] = bColor[i] + Math.round((aColor[i]-bColor[i])*(1-lastRatio));}
			}
		}
		if(isset(alpha)){
			return "rgba(" + middle.r + "," + middle.g + "," + middle.b + "," + alpha + ")";
		}else{
			return "rgb(" + middle.r + "," + middle.g + "," + middle.b + ")";
		}
	},
	
	////设置方块数据////
	setblock: function(block, pos, on, frame){
		block.pos = pos,
		block.on = on,
		block.frame = frame;
	},
	
	////设置|更新方块列表数据////
	setblockList : function(start, num){
		/*生成方块
		规则要求：不连续、双块
		*/
		var that=this, run=that.b.run, two=run.rule.two, pro=run.rule.pro, last=start+num, list=run.list,
		block=run.rule.block, halfBlock=block/2, listMax=run.listMax, blockList=new Array(2),
		row, previousRow, random;
		//循环生成数据
		for(var i=start; i<last; i++){
			random = Math.random(); //获取随机数
			row = parseInt(i%listMax);
			blockList[0] = parseInt(random*block);
			if(pro){ //要求不连续
				previousRow = (row + listMax -1)%listMax; //上一行位置
				if(that.ifOneColumn(blockList[0], list[previousRow][0].pos) || that.ifOneColumn(blockList[0], list[previousRow][1].pos)){
					blockList[0] > halfBlock ? blockList[0]-- : blockList[0]++;
				}
			};
			if(two && random > 0.83){blockList[1] = (blockList[0]+2)%block; //要求双块
			}else{blockList[1] = -1};
			that.setblock(list[row][0], blockList[0], false, 0);
			that.setblock(list[row][1], blockList[1], false, 0);
		};
	},
	
	////返回文本、数组或对象中的随机子对象（用于返回数组文本的随机文本）////
	randomSub: function(e){
		if(e instanceof Array || e.constructor === String){
			//var n = parseInt(Math.random()*e.length);
			//return e[n];
			return e[parseInt(Math.random()*e.length)];
		};
		if(e instanceof Object){
			//var keys = Object.keys(e);
			//var n = parseInt(Math.random()*keys.length);
			//return e[keys[n]];
			var keys = Object.keys(e);
			return e[keys[parseInt(Math.random()*keys.length)]];
		};
		//若非数组或对象，则不返回内容。
	},
	
	////重置游戏界面大小与相关数据////
	resize : function() {
		var that=this, dom=that.dom, canvas=that.canvas, width, height;
		//获取页面宽高
		dom.htmlWidth = getClientWidth();
		dom.htmlHeight = getClientHeight();
		//自适应canvas界面宽高
		width = dom.htmlWidth;
		height = dom.htmlHeight;
		if((height/width) < 1.3){width = parseInt(height / 1.3)}
		//设置canvas宽高
		canvas.width = width;
		canvas.height = height;
		dom.width = width;
		dom.height = height;
		dom.offsetLeft = canvas.offsetLeft;
		dom.offsetTop = canvas.offsetTop;
		//设置domList宽高与位置
		dom.domList.style.width =width + "px";
		dom.domList.style.height = height + "px";
		dom.domList.style.left = dom.offsetLeft + "px";
		dom.domList.style.top = dom.offsetTop + "px";
		dom.domList.style.fontSize = parseInt(width / 20) + "px";
		dom.dTop.style.height = parseInt(width*0.12)-1 + "px";
		dom.dContent.style.height = height - parseInt(width*0.12) + "px";
		//设置缩放比例
		that.style.scale.width = width / that.style.width;
		that.style.scale.height = height / that.style.height;
		
		//执行其他需重置数据的代码
		that.setPageData();
		that.setMiscStyle();
	},
	
	////重置运行数据为初始状态////
	rerun : function() {
		var that = this, run = that.b.run, rule=run.rule;
		//初始化部分状态
		run.gameStart = false; run.errorState = false;
		run.subScoll.on = false;
		run.subScoll.startTime = 0;
		run.subScoll.startPos = 0;
		run.subScoll.startLeft = 0;
		run.subScoll.startTop = 0;
		run.subScoll.subWidth = that.pageData.game.e.sub.width + that.pageData.game.e.sub.marginRight; 
		//初始化时间数据
		for(var i in run.time)run.time[i] = 0;
		//初始化方块列表数据
		run.list = [];
		run.listMax = rule.block + 2;
		for(var i = 0;i<run.listMax;i++){
			run.list[i] = [];
			run.list[i][0] = {pos:-1, on:false, frame:0};
			run.list[i][1] = {pos:-1, on:false, frame:0};
		};
		run.listPos = 0;
		run.runPos = 0;
		//其他数据
		run.score = 0;
		run.timeLeft = rule.timeMax*1000 || 0;
		//run.speed = rule.speed || 0;
		run.speed = 0;
		run.pause = true;
		run.error = {listPos : -1, pos : -1, frame : 0, coinDemand : 0, errorTip : ""};
		run.errorNum = 0;
		run.endColor = run.endColor || that.style.game.color.block;
		run.placeholder = Math.ceil( rule.block / 5 );
		run.lastPos = run.placeholder;
	},
	
	////加载规则////
	loadRule : function(mode, sub) {
		var ruleData = this.rule[mode], subData = ruleData.sub[sub], rule = this.b.run.rule;
		for( var i in ruleData){ //获取主要规则部分
			if(i != "sub" && ruleData.hasOwnProperty(i)){
				rule[i] = ruleData[i];
			}
		};
		for( var i in subData){ //将子规则覆盖到主规则
			if(subData.hasOwnProperty(i)){
				rule[i] = subData[i];
			}
		};
	},
	
	////初始化游戏数据////
	initGameData : function(mode, sub, first) {
		//修复空数据（避免后续调用异常）
		mode = mode || "classic";
		sub = sub || 0;
		//预调用|预置部分参数
		var that = this,
		b=that.b, run=b.run, rule=run.rule;
		//获取rule（规则）
		that.loadRule(mode, sub);
		//设定规则内容
		b.mode = mode; b.sub = sub;if(first)b.subPos = Math.max(0,sub-1);
		//设定方块宽高
		b.width = Math.ceil( that.dom.width / rule.block );
		b.height = Math.ceil( that.dom.height / rule.block );
		//初始化run
		that.rerun();
		//生成方块
		that.setblockList(run.placeholder, run.listMax-run.placeholder);
		
		//重置游戏界面样式
		that.setPageData("game");
	},
	
	////游戏运行数据计算////
	runGameData : function(){
		if(!this.b.run.gameStart || this.b.run.pause)return; //游戏未开始则不执行
		//流程
		//计时（上次时间，本次时间），检测是否需要新绘制方块，叠加数据
		//？？？就这么简单？？？但应该要复杂一点实现吧，现在。
		var that=this, b=that.b, run=b.run, time=run.time,
		lastTime, currTime, interval, currPos, nextPos, currPosI, nextPosI;
		//获取时间数据
		currTime = new Date().getTime(); //获取当前时间
		if(!time.start){//如果时间未初始化，则初始化
			time.start = currTime;
			time.run = 0;
			time.currRun = 0;
			time.last = currTime;
			time.curr = currTime;
			time.interval = 0;
			run.speed = run.rule.speed || 0; //之前未初始化速度，这里初始化
		};
		lastTime = time.curr; //获取上次运行时间
		interval = Math.min(b.frameTimeMax, currTime-lastTime); //获取当前帧间隔
		//判断是否超时
		switch(run.rule.require){
			case "time": case "loop":
				if((time.currRun+interval)>=run.timeLeft){ //超时
					that.playSound("timeEnd");
					run.endColor = that.style.game.color.block;
					that.summary();
					that.switchPage(that.page, "end");
				}
				break;
		};
		//获取位置数据
		currPos = run.listPos + run.runPos;
		currPosI = run.listPos;
		if(run.rule.scroll){ //滚动
			nextPos = currPos + (run.speed * interval / 1000);
			run.speed += run.rule.speedup * interval / 1000;
			if(run.rule.speedMax)run.speed = Math.min(run.speed, run.rule.speedMax);
		}else{ //非滚动
			nextPos = currPos;
			nextPosI = parseInt(nextPos); 
			var rowFrame;
			for(var i=run.placeholder;i<run.listMax;i++){
				rowFrame = that.checkRowFrame(i+nextPosI);
				if(rowFrame!=-1){ //如果该行存在数据，则设定绘制行位置
					var posRatio = rowFrame/b.clickTime;
					//nextPos=i+nextPosI+posRatio-run.placeholder;
					nextPos=i+nextPosI-run.placeholder+ (posRatio>0.5?1-(1-posRatio)*(1-posRatio)*2:posRatio*posRatio*2);
				}else{break;}
			};
			
		};
		nextPosI = parseInt(nextPos); 
		if(!that.checkList(currPosI, nextPosI-currPosI)){
			run.listPos = nextPosI % run.listMax;
			run.runPos = nextPos % 1;
			that.setblockList((currPosI-1+run.listMax)%run.listMax, nextPosI-currPosI);
		}else{ //错误（只有自动滚动会出错）
			run.listPos = (run.lastPos-1+run.listMax)%run.listMax;
			run.runPos = 0;
			that.playSound("error");
			if(run.errorNum<2){ //失误次数在正常范围
				run.errorNum++;
				run.error.coinDemand = (run.score < 100 ? 100 : run.score) * Math.pow(2, run.errorNum);
				run.error.errorTip = that.randomSub(that.pageData.game.TitleList.errorTip);
				run.errorState=true;
				run.pause=true;
				that.getCurrScore();
				that.disableEventInput(600);
			}else{ //失误次数超出则直接结算
				run.endColor = that.style.game.color.block;
				that.summary();
				that.switchPage(that.page, "end");
			}
		};
		
		
		//叠加部分运行数据（感觉这部分需要放到最后？）
		time.run = (currTime-time.start); //运行时间
		time.currRun += interval; //游戏时间
		time.last = time.curr; //上帧时间
		time.curr = currTime; //本帧时间
		time.interval = interval; //本帧间隔
	},
	
	////点击方块判定////
	clickBlock : function(row, column, h){
		//返回数值，无效返回0或空值，成功返回1，错误返回2
		var that = this, autoRow, run=that.b.run, lastPos=run.lastPos, error=true;
		autoRow = h>0.5 ? row+1 : row-1;
		autoRow = (autoRow + run.listMax)%run.listMax;
		if(row == lastPos || autoRow == lastPos){ //点击位置符合判定行位置
			for(var i=0;i<2;i++){
				if(run.list[lastPos][i].pos == column){
					error = false; //如果存在方块，则不是错误点击
					if(!run.list[lastPos][i].on){ //如果判定行该位置存在未点击方块
						run.list[lastPos][i].on = true; //设置方块为点击状态
						run.score = parseInt(run.score) + 1;
						that.playSound("click");
						switch(run.rule.require){
							case "block": //结束要求为限制块数
								if(run.score>=run.rule.max){
									run.endColor = that.style.game.color.victory;
									that.summary();
									that.switchPage(that.page, "end");
								}
								break;
							case "loop":
								if((run.score>=run.rule.max) && (run.score%run.rule.max == 0))run.time.currRun = 0;
								break;
						}
						return 1;
					}
				}
			}
			if(error && row == lastPos){ //点击位置为判定行且未点击到方块
				run.error.listPos = row;
				run.error.pos = column;
				run.error.frame = 0;
				return 2;
			}
		}
		return 0;
	},
	
	////检测当前行是否还有方块可点击////
	checkRow : function(row){
		row = row % this.b.run.listMax;
		var list = this.b.run.list[row];
		for(var i=0;i<2;i++)if(list[i].pos!=-1&&!list[i].on)return true;
		return false;
	},
	
	////检测当前行是否已点击完毕，点击完毕则返回最低帧数，否则返回-1////
	checkRowFrame : function(row){
		row = row % this.b.run.listMax;
		var list = this.b.run.list[row], frame=-1;
		for(var i=0;i<2;i++){
			if(list[i].pos!=-1){
				if(list[i].on){frame = (frame==-1)?list[i].frame:Math.min(frame, list[i].frame);
				}else{frame=-1;break;}
			}
		}
		return frame;
	},
	
	////检测一段列表，是否存在可点击方块////
	checkList : function(start, num){
		var last=start+num, listMax=this.b.run.listMax;
		for(var i=start; i<last; i++)if(this.checkRow(i))return true;
		return false;
	},
	
	////切换界面语言////
	switchLanguage : function(name) {
		var that = this, newName = name, language = that.language;
		if(!newName){ //未提供语言名称，切换到下一个语言
			var currName = that.flags.language,
			languageList = language.list;
			if(currName){ //当前配置项中存在语言设置则执行
				for(var i in languageList){
					if(languageList[i] === currName){
						newName = languageList[(parseInt(i)+1)%languageList.length];
						break;
					}
				}
			}
		}
		//若还不存在语言名称，以及不存在该语言名称的语言，则重置为首个语言
		if(!newName||!language[newName])newName = language.list[0];
		that.flags.language = newName; //设置当前语言名称
		//更新语言内容
		that.setPageData();
	},
	
	////切换音效////
	switchSound : function(){
		this.flags.sound = this.flags.sound?0:1;
	},
	
	////切换页面////
	switchPage : function(page, toPage) {
		var that=this;
		that.page = toPage;
		that.disableEventInput(350);
		if(toPage == "end"){
			if(that.b.run.currScore.scoreTip == that.language[that.flags.language].newBest)that.playSound("victory");
		}
	},
	
	////切换部分DOM界面////
	switchDomPage : function(page) {
		var that=this, dom=that.dom, language=that.language[that.flags.language], reset=false;
		switch(page){
			case "leaderboard": //排行榜
			case "profile": //个人概览
				reset = true;
			case "bestScore": //最佳成绩
			case "gamesPlayed": //游戏次数
			case "tilesCollected": //踩集块数
			case "about": //关于
				that.domPage = page;
				dom.domList.style.display = "block";
				that.setDomPage(language[page], reset, page);
				break;
			default :
				that.domPage = ""; dom.domList.style.display = "none"; break;
		};
	},
	
	////更改当前Dom页面////
	setDomPage : function(title, reset, page) {
		var that=this, dom=that.dom, language=that.language[that.flags.language];
		//设置标题文本
		dom.dTopTitle.innerText = title;
		//确认是否需要存在重置按钮
		dom.dReset.style.display = reset?"block":"none";
		//清空容器内容
		while(dom.dContent.childNodes[0]){
			dom.dContent.removeChild(dom.dContent.childNodes[0]);
		};
		//根据页面重置内容
		//——排行榜——//
		if(page == "leaderboard"){
			//显示街机|极速模式的数据
			var leaderboard=that.score.leaderboard;
			for(var i in leaderboard){
				var dc, dTitle, dSub, score, dScore = new Array();
				//创建标题
				dTitle = that.createE("div", "dTitle", 
						[that.createE("div", "dLeft", 
							[that.createE("span", null, [that.createText(language.modeList[i][0])]) 
						])
					]);
				//获取成绩数据
				for(var l = 0;l<leaderboard[i].length;l++){
					score = leaderboard[i][l] || 0; //若成绩不存在则默认成绩为0
					dScore[l] = that.createE("span", null,
						[that.createE("div", "dLeft",
							[that.createE("span", null, [that.createText(l)])]),
						that.createE("div", "dRight",
							[that.createE("span", "dSubVal", [that.createText(that.getModeScore(i,score))])])
						]);
				};
				//设置成绩数据
				dSub = that.createE("div", "dSub", dScore);
				dc = that.createE("div", "dc", [dTitle, dSub]);
				//将内容呈现到网页
				dom.dContent.appendChild(dc);
			}
		};
		//——个人概览——//
		if(page == "profile"){
			var TitleList = ["bestScore", "gamesPlayed", "tilesCollected"], dc, dSub, dButton = new Array();
			for(var i in TitleList){
				var p = TitleList[i], button;
				button = that.createE("div", "button");
				button.key = p;
				button.onclick = function(){that.switchDomPage(this.key)};
				dButton[i] = that.createE("span", null,
					[button,
					that.createE("div", "dLeft",
						[that.createE("span", null, [that.createText(language[p])])]),
					that.createE("div", "dRight",
						[that.createE("span", "dLinkSymbol", [that.createText(">")])])
					]);
			};
			dSub = that.createE("div", "dSub", dButton);
			dc = that.createE("div", "dc", [dSub]);
			//将内容呈现到网页
			dom.dContent.appendChild(dc);
		};
		//——关于——//
		if(page == "about"){
			var dc, dSub, aTab={}, img={}, span={}, TitleList = ["umoni", "bilibili", "weibo"];
			//预置数据
			for(var i in TitleList){
				//链接
				aTab[TitleList[i]] = that.createE("a", "button");
				aTab[TitleList[i]].href = that.language.misc[TitleList[i]+"URL"];
				//图片
				img[TitleList[i]] = that.img[TitleList[i]];
				//数据组
				span[TitleList[i]] = that.createE("span", null, [
					aTab[TitleList[i]],
					that.createE("div", "dLeft", [
						img[TitleList[i]],
						that.createE("span", null, [that.createText(TitleList[i]=="umoni"?language.thanks:language[TitleList[i]])])
						]),
					that.createE("div", "dRight", [
						that.createE("span", "dLinkTitle", [that.createText(TitleList[i]=="umoni"?language.thanksFor:that.language.misc[TitleList[i]+"Name"])]),
						that.createE("span", "dLinkSymbol", [that.createText(">")])
						])
					]);
			}
			//感谢原开发团队
			dc = that.createE("div", "dc", [that.createE("div", "dSub", [span.umoni])]);
			dom.dContent.appendChild(dc);
			//本人联系方式
			dc = that.createE("div", "dc", [
				that.createE("div", "dTitle", [
					that.createE("div", "dLeft", [
						that.createE("span", null, [that.createText(language.contact)])
						])
					]),
				that.createE("div", "dSub", [span.bilibili, span.weibo]),
				that.createE("div", "dAboutTip", [that.createText(language.subscribe)]),
				]);
			dom.dContent.appendChild(dc);
		};
		//——各种成绩、数据展示——//
		if(page == "bestScore" || page == "gamesPlayed" || page == "tilesCollected"){
			var scoreData = that.score[page], dc, dTitle, dSub, span, score, sum;
			for(var i in scoreData){ //遍历模式
				span = new Array();
				sum = 0;
				for(var l in scoreData[i]){ //遍历子模式
					if(page == "bestScore"){//最佳成绩
						score = that.getModeScore(i, scoreData[i][l]);
					}else{ //其他计数
						score = scoreData[i][l] || 0;
						sum += score;
					}
					span[l] = that.createE("span", null, [
						that.createE("div", "dLeft", [
							that.createE("span", null, [that.createText(language.modeList[i][1][l])])
							]),
						that.createE("div", "dRight", [
							that.createE("span", "dSubVal", [that.createText(score)])
							])
						])
				}
				//标题
				if(page == "bestScore"){
					dTitle = that.createE("div", "dTitle", [
						that.createE("div", "dLeft", [ that.createE("span", null, [that.createText(language.modeList[i][0])]) ])
						]);
				}else{
					dTitle = that.createE("div", "dTitle", [
						that.createE("div", "dLeft", [ that.createE("span", null, [that.createText(language.modeList[i][0])]) ]),
						that.createE("div", "dRight", [ that.createE("span", null, [that.createText(sum)]) ])
						]);
				}
				//内容
				dSub = that.createE("div", "dSub", span);
				//置入显示
				dc = that.createE("div", "dc", [dTitle, dSub]);
				dom.dContent.appendChild(dc);
			}
		};
	},
	
	////DOM页面返回操作////
	tolastDomPage : function() {
		var that=this, page = that.domPage;
		switch(page){
			case "bestScore": case "gamesPlayed": case "tilesCollected":
				that.switchDomPage("profile");
				break;
			case "leaderboard": //排行榜
			case "profile": //个人概览
			case "about": //关于
			default:
				that.switchDomPage();
				break;
		}
	},
	
	////DOM页面点击重置////
	resetSave : function() {
		var reText = this.language[this.flags.language].reScore;
		if(confirm(reText)){ //重置
			var that = this;
			//重置成绩
			that.score.bestScore = {};
			that.score.gamesPlayed = {};
			that.score.tilesCollected = {};
			for(var i in that.rule){
				that.score.bestScore[i] = [];
				that.score.gamesPlayed[i] = [];
				that.score.tilesCollected[i] = [];
				for(var l in that.rule[i].sub){
					that.score.bestScore[i][l] = 0;
					that.score.gamesPlayed[i][l] = 0;
					that.score.tilesCollected[i][l] = 0;
				}
			}
			//重置排行榜
			that.score.leaderboard = {arcade:new Array(5), rush:new Array(5)};
			that.save();
			//刷新当前DOM页面
			that.switchDomPage(that.domPage);
		}
	},
	
	////创建DOM元素////
	createE : function(e, classname, child) {
		var dom=document.createElement(e); //创建对应内容
		if(isset(classname))dom.className = classname; //设定class
		for(var i in child){ //追加子内容
			dom.appendChild(child[i]);
		}
		return dom;
	},
	
	////创建DOM文本节点////
	createText : function(t) {
		return document.createTextNode(t);
	},
	
	////提供模式、数据，返回对应显示字符////
	getModeScore : function(mode ,val) {
		val = val || 0; //校正数值
		var tip = this.rule[mode].tip;
		switch(tip){
			case "playTime": //消耗时间
				return (val/1000).toFixed(3) + this.language.misc.symbol[1];
			case "speed": //滚屏速度
				return val.toFixed(3) + this.language.misc.symbol[2];
			case "timeLeft": case "block": default: //点击块数
				return val.toString();
		};
	},
	
	////播放音效////——待编辑
	playSound : function(name) {
		var that = this, sound=that.sound[name];
		if(sound && that.flags.sound == 0){
			if(that.audioContext){
				var audioCtx = that.audioContext;
				//创建临时bufferSouceNode并播放
				var audioBufferSouceNode = audioCtx.createBufferSource();
				audioBufferSouceNode.connect(audioCtx.destination); //关联到扬声器
				audioBufferSouceNode.buffer = sound.buffer;
				audioBufferSouceNode.start(0);
			}else{ //本地or传统播放
				sound.audio.currentTime=0;
				sound.audio.play();
			}
		}
	},
	
	////禁用回调////
	disableEventInput : function(l){
		this.disableInput.l = l || 600;
		return this.disableInput.t = new Date().getTime();
	},
	
	////执行事件回调////
	execution : function(page) {
		var that = this,
		state = that.state,
		page = page || that.page,
		currTime = new Date().getTime();
		if(state.resize){ //若存在窗口大小变动
			that.resize();
			state.resize = false;
		};
		if(state.onscroll){
			that.getScroll();
			state.onscroll = false;
		};
		
		if(that.disableInput.t < currTime - that.disableInput.l){ //如果当前时间大于禁用回调时间
			switch(page){ //根据页面决定判定的内容
				case "menu": that.eventMenu();break;
				case "game": that.eventGame();break;
				case "settings": that.eventSettings();break;
				case "end": that.eventEnd();break;
				default : that.page = "menu";that.eventMenu();break;
			};
		}
		//删掉其他的状态，避免后续误触发
		for(var i in state){if(state.hasOwnProperty(i))state[i]=false;};
	},
	
	////事件回调-模式菜单页面////
	eventMenu : function() {
		//同时只接受一种方式的数据，触控优先
		var eName = this.state.touchend?"touchend":(this.state.mouseup?"mouseup":"");
		if(!eName)return;//若为空数据则直接返回，不执行后续代码
		var that=this, eventState=that.eventState;
		var clientX,clientY,bw,bh,target;
		//计算点击位置
		bw = that.pageData.menu.e.button.width;
		bh = that.pageData.menu.e.button.height;
		clientX = eventState[eName][0].clientX;
		clientY = eventState[eName][0].clientY;
		target = (Math.max(0,Math.ceil(clientX/bw)-1)) + (Math.max(0,Math.ceil(clientY/bh)-1)*2);
		that.state[eName] = false;
		//根据位置判断执行内容
		if(target < that.language.misc.mode.length){
			var mode = that.language.misc.mode[target];
			//console.log("game",target,mode, that.flags.lastMode[mode]);
			that.initGameData(mode, that.flags.lastMode[mode], true);
			that.switchPage(that.page, "game");
		}else{
			//console.log("settings");
			that.switchPage(that.page, "settings");
		}
	},
	
	////事件回调-游戏页面////
	eventGame : function() {
		//游戏界面的回调执行流程：
		//游戏子模式按钮交互检测（按下后subScoll状态为真，直到检测到弹起状态）（需要gameStart为假，errorState为假）
		//游戏主体交互检测（需要subScoll为假，errorState为假）
		//错误界面检测（需要errorState为真）
		
		//mousedown touchstart 子模式、主体
		//mouseup touchend 子模式（处于subScoll状态中）、错误
		//mousemove touchmove 子模式（处于subScoll状态中）
		var that=this, eventState=that.eventState, b=that.b, run=b.run, clientX, clientY;
		//判定——按下（触摸|鼠标取其一，触摸优先）
		var eName = this.state.touchstart?"touchstart":(this.state.mousedown?"mousedown":"");
		if(eName && !run.subScoll.on && !run.errorState){ //按下-判定，子模式or主体（子模式滚动状态还在则不进行判定）
			if(!run.gameStart){ //游戏未开始，判定子模式按钮交互
				clientX = eventState[eName][0].clientX;
				clientY = eventState[eName][0].clientY;
				if((that.dom.height - clientY) < that.pageData.game.e.sub.height){ //Y轴在子模式范围内则记录数据
					var subScoll = run.subScoll;
					subScoll.on = true;
					subScoll.startTime = new Date().getTime();
					subScoll.startPos = b.subPos;
					subScoll.startLeft = clientX;
					subScoll.startTop = clientY;
				}
			}
			if(!run.subScoll.on){ //上面未触发子模式滚动状态则判定主体内容
				for(var i=0;i<eventState[eName].length;i++){
					clientX = eventState[eName][i].clientX;
					clientY = eventState[eName][i].clientY;
					var listPos = ((that.dom.height-clientY)/b.height + run.listPos + run.runPos)%run.listMax,
					pos = Math.max(0,Math.ceil(clientX / b.width) - 1);
					switch(that.clickBlock(parseInt(listPos), pos, listPos%1)){ //处理点击回执
						case 0: //无效点击
							break;
						case 1: //点击成功
							if(!run.gameStart)run.gameStart=true;
							if(run.pause)run.pause=false;
							for(var l=0;l<run.listMax;l++){
								if(that.checkRow(run.lastPos))break;
								run.lastPos = (run.lastPos+1)%run.listMax;
							}
							break;
						case 2: //点击失误
							that.playSound("error");
							if(run.errorNum<2){
								run.errorNum++;
								run.error.coinDemand = (run.score < 100 ? 100 : run.score) * Math.pow(2, run.errorNum);
								run.error.errorTip = that.randomSub(that.pageData.game.TitleList.errorTip);
								run.endColor = that.style.game.color.error;
								run.errorState=true;
								run.pause=true;
								that.getCurrScore();
								that.disableEventInput(600);
							}else{
								that.summary();
								that.switchPage(that.page, "end");
							};
							break;
					};
				}
			}
		}
		
		//判定——移动（触摸|鼠标取其一，触摸优先）
		var eName = this.state.touchmove?"touchmove":(this.state.mousemove?"mousemove":"");
		if(eName && run.subScoll.on && !run.errorState){ //子模式移动操作，处于滚动状态时才会触发
			clientX = eventState[eName][0].clientX;
			b.subPos = Math.max(-1,(run.subScoll.startLeft - clientX) / run.subScoll.subWidth + run.subScoll.startPos);
			b.subPos = Math.min(b.subPos, that.pageData.game.subTitle[b.mode].length-1);
		};
		
		//判定——弹起（触摸|鼠标取其一，触摸优先）
		var eName = this.state.touchend?"touchend":(this.state.mouseup?"mouseup":"");
		if(eName){ //子模式点击或结束移动操作，错误界面按钮操作
			if(run.subScoll.on){ //子模式的操作
				run.subScoll.on = false;
				//判断是否是点击操作
				clientX = eventState[eName][0].clientX;
				clientY = eventState[eName][0].clientY;
				var interval = (new Date().getTime()) - run.subScoll.startTime, tolerance = run.subScoll.subWidth*0.1, newSub;
				if(interval < 300){ //间隔在300ms以内
					if(Math.abs(clientX-run.subScoll.startLeft)<tolerance && Math.abs(clientY-run.subScoll.startTop)<tolerance){//坐标误差在允许范围内
						//计算点击位置算几号子模式
						newSub = parseInt((run.subScoll.startLeft / run.subScoll.subWidth) + b.subPos);
						//新模式编号数值在子模式数值范围内且与当前子模式不同
						if(b.sub!=newSub && newSub>=0 && newSub<that.pageData.game.subTitle[b.mode].length){
							b.sub=newSub;
							that.initGameData(b.mode, b.sub);
						}
					}
				}
			}
			if(run.errorState){ //错误界面操作
				clientX = eventState[eName][0].clientX;
				clientY = eventState[eName][0].clientY;
				var pageData=that.pageData.game.e, buttonOut=pageData.buttonOut, buttonGo=pageData.buttonGo;
				if(clientY>buttonOut.top && clientY<(buttonOut.top+buttonOut.height)){
					if(clientX>buttonOut.left && clientX<(buttonOut.left+buttonOut.width)){ //结束
						that.summary();
						that.switchPage(that.page, "end");
					}
					if(clientX>buttonGo.left && clientX<(buttonGo.left+buttonGo.width)){ //继续
						if(parseInt(that.score.coin) >= run.error.coinDemand){ //货币足够，继续游戏
							run.errorState=false;
							run.error.listPos = -1;
							run.error.pos = -1;
							that.score.coin = parseInt(that.score.coin) - run.error.coinDemand;
						}else{ //货币不够，友情提示
							run.error.errorTip = that.language[that.flags.language].errorTipCoin;
						}
					}
				}
			}
		};
	},
	
	////事件回调-设置页面////
	eventSettings : function() {
		//同时只接受一种方式的数据，触控优先
		var eName = this.state.touchend?"touchend":(this.state.mouseup?"mouseup":"");
		if(!eName)return;//若为空数据则直接返回，不执行后续代码
		var that=this, eventState=that.eventState;
		var clientX,clientY,bw,bh,target;
		//计算点击位置
		bw = that.pageData.settings.e.button.width;
		bh = that.pageData.settings.e.button.height;
		clientX = eventState[eName][0].clientX;
		clientY = eventState[eName][0].clientY;
		target = (Math.max(0,Math.ceil(clientX/bw)-1)) + (Math.max(0,Math.ceil(clientY/bh)-1)*2);
		that.state[eName] = false;
		//根据位置判断执行内容
		switch(target){
			case 0: //返回
				that.switchPage(that.page, "menu"); break;
			case 1: //排行榜
				that.switchDomPage("leaderboard"); break;
			case 2: //个人概览
				that.switchDomPage("profile"); break;
			case 3: //切换音效
				that.switchSound(); that.save(); break;
			case 4: //切换语言
				that.switchLanguage(); that.save(); break;
			case 5: //关于
				that.switchDomPage("about"); break;
		};
	},
	
	////事件回调-结算页面////
	eventEnd : function() {
		//同时只接受一种方式的数据，触控优先
		var eName = this.state.touchend?"touchend":(this.state.mouseup?"mouseup":"");
		if(!eName)return;//若为空数据则直接返回，不执行后续代码
		var that=this, eventState=that.eventState;
		var clientX,clientY,bLeft,bTop,bw,bh,spacing,target;
		//计算点击位置
		bLeft = that.pageData.end.e.share.left;
		bTop = that.pageData.end.e.share.top;
		bw = that.pageData.end.fontSize.title*2;
		bh = that.pageData.end.fontSize.title;
		spacing = that.pageData.end.e.exit.left - that.pageData.end.e.share.left;
		bLeft = bLeft - bw/2;
		bTop = bTop - bh/2;
		clientX = eventState[eName][0].clientX;
		clientY = eventState[eName][0].clientY;
		if(clientY >= bTop && clientY <= bTop+bh){ //确认纵向范围在按钮范围内
			if(clientX >= bLeft && clientX <= bLeft+spacing*3){ //确认纵向范围在按钮范围内
				var overflow = (clientX - bLeft) % spacing, button = parseInt((clientX - bLeft) / spacing);
				if(overflow <= bw)target = button;
			}
		}
		that.state[eName] = false;
		if(isset(target)){ //看是否存在数据
			
			switch(target){
				case 0: //炫耀
					try{
						window.open('about:blank','image').document.write("<title>请保存图片</title><h1>可保存该图片，本页面不消耗流量</h1><img src='"+that.canvas.toDataURL("image/png")+"' alt='炫耀'/>");
					}catch(e){
						that.drawTip("弹出窗口被拦截，请同意弹窗或使用第三方软件截取游戏画面");
					}
					break;
				case 1: //返回
					that.switchPage(that.page, "menu"); break;
				case 2: //重来
					var mode = that.b.mode;
					that.initGameData(mode, that.flags.lastMode[mode]);
					that.switchPage(that.page, "game");break;
			}
		}
	},
	
	////根据页面决定绘制方式////
	drawInterface : function(page) {
		var that = this;
		page = page || that.page;
		switch(page){
			case "menu": that.drawMenu();break;
			case "game": that.drawGame();break;
			case "settings": that.drawSettings();break;
			case "end": that.drawEnd();break;
			default : that.page = "menu";that.drawMenu();break;
		};
	},
	
	////绘制页面-模式菜单页面////
	drawMenu : function() {
		var that=this, c2d=that.c2d, page="menu", style=that.style, pageData=that.pageData[page];
		var TitleList = pageData.TitleList,
		buttonWidth = pageData.e.button.width,
		buttonHeight = pageData.e.button.height,
		fontLeft = pageData.e.button.fontLeft,
		fontTop = pageData.e.button.fontTop,
		font = pageData.font;
		
		//绘制白色底色
		c2d.fillStyle = style.color.normal;
		c2d.fillRect(0,0,that.dom.width,that.dom.height);
		//绘制黑色底色
		c2d.fillStyle = style.color.reverse;
		c2d.fillRect(buttonWidth,0,buttonWidth,buttonHeight); //1-2
		c2d.fillRect(0,buttonHeight,buttonWidth,buttonHeight); //2-1
		//绘制灰色底色
		c2d.fillStyle = style.menu.color.settings;
		c2d.fillRect(buttonWidth,buttonHeight*2,buttonWidth,buttonHeight); //3-2
		//绘制黑色文字
		c2d.font = font.title;
		c2d.textAlign = "center";
		c2d.textBaseline = "middle";
		c2d.fillStyle = style.color.reverse;
		c2d.fillText( TitleList[0], fontLeft , fontTop ); //1-1
		c2d.fillText( TitleList[3], fontLeft + buttonWidth , fontTop + buttonHeight ); //2-2
		c2d.fillText( TitleList[4], fontLeft , fontTop + buttonHeight*2 ); //3-1
		//绘制白色文字
		c2d.fillStyle = style.color.normal;
		c2d.fillText( TitleList[1], fontLeft + buttonWidth , fontTop ); //1-2
		c2d.fillText( TitleList[2], fontLeft , fontTop + buttonHeight ); //2-1
		c2d.fillText( TitleList[5], fontLeft + buttonWidth , fontTop + buttonHeight*2 ); //3-2
		//积分提示绘制
		c2d.fillStyle = style.menu.color.settings;
		c2d.font = font.coin;
		c2d.textAlign = "right";
		c2d.textBaseline = "top";
		c2d.fillText( that.score.coin + that.language.misc.symbol[0], pageData.e.coin.left, pageData.e.coin.top );
	},
	
	////绘制页面-游戏页面////
	drawGame : function() {
		//绘制游戏基础内容，底色、显示方块、错误方块、线条、进度条、文字提示、开始提示
		//绘制子模式选项（如果游戏开始，则不绘制）
		//绘制失败界面（如果点击错误方块，则绘制，否则不绘制）
		var that=this, c2d=that.c2d, width=that.dom.width, height=that.dom.height, pageData=that.pageData.game,
		b=that.b, run=b.run, font=pageData.font, TitleList=pageData.TitleList, color=that.style.game.color,
		lineAuto = 0.5;
		
		//——绘制基础部分——//
		{
			//预计算部分绘制内容
			var listId=[], blockStyle=[], onblockStyle=[], errorStyle={}, offsetLeft=[], offsetTop=[];
			for(var i=0;i<run.rule.block;i++)offsetLeft[i] = i * b.width;
			for(var i=0;i<run.listMax;i++){ //正常方块位置预置
				listId[i] = parseInt((i+run.listPos)%run.listMax) //绘制的对应行数ID预置
				offsetTop[i] = height - (i+1)*b.height + parseInt(run.runPos * b.height);
				blockStyle[i]=[];
				onblockStyle[i]=[];
				for(var l=0;l<2;l++){
					blockStyle[i][l]={};
					onblockStyle[i][l]={};
					if(run.list[listId[i]][l].pos != -1){ //方块绘制位置预置
						blockStyle[i][l].left = offsetLeft[run.list[listId[i]][l].pos];
						blockStyle[i][l].top = offsetTop[i];
						if(run.list[listId[i]][l].on){ //点击方块绘制位置预置
							onblockStyle[i][l].width = parseInt(b.width * Math.min(1, 0.8+0.2*(run.list[listId[i]][l].frame/12)));
							onblockStyle[i][l].height = parseInt(b.height * Math.min(1, 0.8+0.2*(run.list[listId[i]][l].frame/12)));
							onblockStyle[i][l].left = blockStyle[i][l].left + parseInt((b.width-onblockStyle[i][l].width)/2);
							onblockStyle[i][l].top = blockStyle[i][l].top + parseInt((b.height-onblockStyle[i][l].height)/2);
							if(run.list[listId[i]][l].frame < b.clickTime)run.list[listId[i]][l].frame++;
						}
					}
				}
			}
			if(run.error.listPos != -1 && run.error.pos != -1){ //错误方块位置预置
				errorStyle.left = run.error.pos * b.width; 
				//errorStyle.top = height - parseInt((run.error.listPos - run.listPos + run.listMax + 1) % run.listMax) * b.height;
				errorStyle.top = offsetTop[(run.error.listPos-run.listPos+run.listMax)%run.listMax];
			}
			
			//绘制背景
			c2d.fillStyle = color.bg;
			c2d.fillRect(0,0,width,height);
			
			//绘制方块
			c2d.fillStyle = color.block;
			for(var i=0;i<run.listMax;i++){
				for(var l=0;l<2;l++){
					if(run.list[listId[i]][l].pos != -1){
						c2d.fillRect(blockStyle[i][l].left, blockStyle[i][l].top, b.width, b.height);
					}
				}
			}
			
			//绘制点击方块
			c2d.fillStyle = color.onblock;
			for(var i=0;i<run.listMax;i++){
				for(var l=0;l<2;l++){
					if(run.list[listId[i]][l].pos != -1 && run.list[listId[i]][l].on){
						c2d.fillRect(onblockStyle[i][l].left, onblockStyle[i][l].top, onblockStyle[i][l].width, onblockStyle[i][l].height);
					}
				}
			}
			
			//绘制错误方块
			if(run.error.listPos != -1 && run.error.pos != -1){
				c2d.fillStyle = color.error;
				c2d.fillRect(errorStyle.left, errorStyle.top, b.width, b.height);
			}
			
			//绘制线条
			c2d.lineWidth = 1;
			c2d.strokeStyle = color.line;
			c2d.beginPath();
			for(var i = 0;i<run.rule.block;i++){ //竖线
				c2d.moveTo(offsetLeft[i] - lineAuto ,0);
				c2d.lineTo(offsetLeft[i] - lineAuto ,height);
			};
			for(var i = 0;i<run.listMax;i++){ //横线
				c2d.moveTo(0 ,offsetTop[i]-lineAuto);
				c2d.lineTo(width ,offsetTop[i]-lineAuto);
			};
			c2d.stroke();
			
			//绘制经典模式覆盖颜色
			if(run.rule.require == "block"){
				if(run.rule.max <= (run.score + run.rule.block - run.placeholder)){
					var l = run.rule.max + (run.placeholder-1) - run.score + (run.lastPos - run.listPos - run.placeholder + run.listMax) % run.listMax;
					c2d.fillStyle = color.victory;
					c2d.fillRect(0, 0, width, offsetTop[l]);
				}
			};
			
			//绘制上方进度条
			if(run.rule.progressBar != "none"){ //如果需要进度条则进行绘制
				var progress;
				switch(run.rule.progressBar){ //根据进度条类型决定进度内容
					case "block": //点击块数进度
						progress = run.score / run.rule.max; break;
					case "timeLeft": //剩余时间
						progress = (run.timeLeft-run.time.currRun)/run.timeLeft; break;
					case "loop": //当前阶段点击块数进度
						progress = (run.score % run.rule.max) / run.rule.max; break;
				};
				c2d.fillStyle = that.calcMiddleColor(color.ProgressBar, progress);
				c2d.fillRect(0,0,parseInt(width*progress),2);
				c2d.fillStyle = color.ProgressBarS;
				c2d.fillRect(0,2,parseInt(width*progress),2);
			};
			
			//绘制上方提示
			var gameTip = "";
			switch(run.rule.tip){ //根据提示类型决定内容
				case "playTime": //消耗时间
					gameTip = (run.time.currRun/1000).toFixed(3) + that.language.misc.symbol[1]; break;
				case "block": //点击块数
					gameTip = run.score.toString(); break;
				case "speed": //滚屏速度
					gameTip = run.speed.toFixed(3) + that.language.misc.symbol[2]; break;
				case "timeLeft": //剩余时间
					gameTip = ((run.timeLeft-run.time.currRun)/1000).toFixed(3) + that.language.misc.symbol[1];
					break;
			}
			c2d.font = font.gameTip;
			c2d.textAlign = "center";
			c2d.textBaseline = "middle";
			c2d.fillStyle = color.gameTipS; //绘制提示文字阴影
			c2d.fillText(gameTip, pageData.e.gameTip.left+2, pageData.e.gameTip.top+2 );
			switch(run.rule.tip){ //决定绘制文字颜色
				case "timeLeft": //根据剩余时间进度来决定绘制提示的颜色
					var progress = (run.timeLeft-run.time.currRun)/run.timeLeft;
					c2d.fillStyle = that.calcMiddleColor(color.ProgressBar, progress);
					break;
				default: //默认红色
					c2d.fillStyle = color.gameTip;  break;
			}
			c2d.fillText(gameTip, pageData.e.gameTip.left, pageData.e.gameTip.top );
			
			//绘制开始提示
			if(run.pause){//如果处于暂停状态
				for(var i=0;i<run.listMax;i++){
					if(run.list[listId[i]][0].pos != -1 && !run.list[listId[i]][0].on || run.list[listId[i]][1].pos != -1 && !run.list[listId[i]][1].on){ //如果当前行存在数据且未点击该方块则进行绘制
						c2d.font = font.start;
						c2d.fillStyle = that.style.color.normal;
						c2d.textAlign = "center";
						c2d.textBaseline = "middle";
						for(var l=0;l<2;l++){
							if(run.list[listId[i]][l].pos != -1 && !run.list[listId[i]][l].on){
								c2d.fillText(pageData.startTitle, blockStyle[i][l].left+pageData.e.blockTip.left, blockStyle[i][l].top+pageData.e.blockTip.top );
							}
						}
						break;
					}
				}
			}
		}
		//——基础绘制结束——//
		//——绘制子模式部分——//
		if(!run.gameStart){ //游戏未开始则绘制
			//预计算部分绘制内容
			var subStyle=[], subTitle=pageData.subTitle[b.mode],
			subWidth=pageData.e.sub.width+pageData.e.sub.marginRight;
			for(var i=0; i<subTitle.length;i++){
				subStyle[i] = {}
				subStyle[i].left = parseInt((i - b.subPos) * subWidth);
				subStyle[i].top = height - pageData.e.sub.height;
				subStyle[i].fontLeft = subStyle[i].left + pageData.e.sub.fontLeft;
				subStyle[i].fontTop = subStyle[i].top + pageData.e.sub.fontTop;
			};
			//绘制子模式方块背景
			c2d.fillStyle = color.subBg;
			for(var i=0; i<subTitle.length;i++){
				if( (subStyle[i].left + subWidth >= 0) && (subStyle[i].left <= width)){
					c2d.fillRect(subStyle[i].left, subStyle[i].top, pageData.e.sub.width, pageData.e.sub.height)
				}
			};
			//绘制选中子模式方块背景
			c2d.fillStyle = color.onsubBg;
			c2d.fillRect(subStyle[b.sub].left, subStyle[b.sub].top, pageData.e.sub.width, pageData.e.sub.height)
			//绘制子模式方块文字
			c2d.font = font.sub;
			c2d.textAlign = "center";
			c2d.textBaseline = "middle";
			c2d.fillStyle = color.sub;
			for(var i=0; i<subTitle.length;i++){
				if( (subStyle[i].left + subWidth >= 0) && (subStyle[i].left <= width)){
					c2d.fillText(subTitle[i], subStyle[i].fontLeft, subStyle[i].fontTop)
				}
			};
			//绘制选中子模式方块文字
			c2d.fillStyle = color.onsub;
			c2d.fillText(subTitle[b.sub], subStyle[b.sub].fontLeft, subStyle[b.sub].fontTop)
		};
		//——子模式绘制结束——//
		//——绘制失败界面部分——//
		if(run.errorState){ //如果处于错误状态中
			//预置绘制内容参数
			var errorStyle=pageData.e, offset, coinTitle, errorSubTitle, errorTitle, bestScore;
			errorTitle = run.currScore.score;
			errorSubTitle = run.currScore.scoreTip;
			coinTitle = run.error.coinDemand + that.language.misc.symbol[0];
			//绘制背景底色与提示框底色阴影
			c2d.fillStyle = color.shadow;
			c2d.fillRect(0,0,width,height);
			offset = errorStyle.errorShadow;
			c2d.roundRect(offset.left, offset.top, offset.width, offset.height, offset.radius, "fill");
			//绘制提示框底色
			c2d.fillStyle = that.style.color.normal;
			offset = errorStyle.errorBg;
			c2d.roundRect(offset.left, offset.top, offset.width, offset.height, offset.radius, "fill");
			//绘制tip提示底色
			c2d.fillStyle = color.gray;
			offset = errorStyle.errorTipBg;
			c2d.roundRect(offset.left, offset.top, offset.width, offset.height, offset.radius, "fill");
			//绘制按钮底色-左
			//c2d.strokeStyle = color.gray;
			c2d.strokeStyle = that.style.color.reverse;
			offset = errorStyle.buttonOut;
			c2d.lineWidth = offset.lineWidth;
			c2d.roundRect(offset.left, offset.top, offset.width, offset.height, offset.radius, "stroke");
			//绘制按钮文字-左
			c2d.fillStyle = that.style.color.reverse;
			c2d.textAlign = "center";
			c2d.textBaseline = "middle";
			c2d.font = font.button;
			c2d.fillText(TitleList.endGame, offset.fontLeft, offset.fontTop);
			//绘制按钮底色-右
			c2d.fillStyle = that.style.color.reverse;
			offset = errorStyle.buttonGo;
			c2d.roundRect(offset.left, offset.top, offset.width, offset.height, offset.radius, "fill");
			//绘制按钮文字-右
			c2d.fillStyle = that.style.color.normal;
			c2d.fillText(TitleList.playOn, offset.fontLeft, offset.fontTop);
			c2d.font = font.coin;
			c2d.fillText(coinTitle, offset.fontLeft, offset.fontTopB);
			//绘制其他文字
			//友情提示
			c2d.fillStyle = that.style.color.reverse;
			c2d.font = font.errotTip;
			offset = errorStyle.errorTip;
			c2d.fillText(run.error.errorTip, offset.left, offset.top);
			//历史记录||新纪录提示
			c2d.font = font.errorTitleSub;
			offset = errorStyle.errorSubTitle;
			c2d.fillText(errorSubTitle, offset.left, offset.top);
			//成绩提示
			c2d.font = font.errorTitle;
			offset = errorStyle.errorTitle;
			c2d.fillText(errorTitle, offset.left, offset.top);
		};
		//——失败界面绘制结束——//
	},
	
	////绘制页面-设置页面////
	drawSettings : function() {
		var that=this, c2d=that.c2d, page="settings", style=that.style, pageData=that.pageData[page];
		var TitleList = pageData.TitleList,
		buttonWidth = pageData.e.button.width,
		buttonHeight = pageData.e.button.height,
		fontLeft = pageData.e.button.fontLeft,
		fontTop = pageData.e.button.fontTop,
		font = pageData.font,
		textId, text, selectTitle={};
		//预置多选数据
		selectTitle[3] = TitleList[3] + that.language.misc.symbol[3] + pageData.soundTitle[that.flags.sound];
		selectTitle[4] = TitleList[4] + that.language.misc.symbol[3] + pageData.languageTitle[that.flags.language];
		//绘制白色底色
		c2d.fillStyle = style.color.normal;
		c2d.fillRect(0,0,that.dom.width,that.dom.height);
		//绘制黑色底色\黑色文字
		c2d.fillStyle = style.color.reverse;
		c2d.font = font.title;
		c2d.textAlign = "center";
		c2d.textBaseline = "middle";
		for(var i = 0;i<pageData.row; i++){
			c2d.fillRect((i%2)*buttonWidth,i*buttonHeight,buttonWidth,buttonHeight);
			textId = ((i+1)%2)+i*2;
			text = selectTitle[textId] || TitleList[textId]; 
			c2d.fillText(text , ((i+1)%2)*buttonWidth+fontLeft, i*buttonHeight+fontTop);
		};
		//绘制白色文字
		c2d.fillStyle = style.color.normal;
		for(var i = 0;i<pageData.row; i++){
			textId = i%2+i*2;
			text = selectTitle[textId] || TitleList[textId]; 
			c2d.fillText(text , (i%2)*buttonWidth+fontLeft, i*buttonHeight+fontTop);
		};
		
	},
	
	////绘制页面-结算页面////
	drawEnd : function() {
		var that=this, c2d=that.c2d, page="end", style=that.style, pageData=that.pageData[page];
		var TitleList = pageData.TitleList,
		font = pageData.font,
		language = that.language[that.flags.language],
		b = that.b, run=b.run, mode = b.mode || "classic",
		bgColor, offset, fontLeft, fontTop, bestScore;
		//部分文本预置
		TitleList.coin = that.score.coin + that.language.misc.symbol[0];
		TitleList.mode = language.modeList[mode][0] + language.mode;
		TitleList.sub = language.modeList[mode][1][b.sub];
		//背景颜色预置
		bgColor = run.endColor || "#AAA";
		//得分与描述
		TitleList.score = run.currScore.score;
		TitleList.scoreSub = run.currScore.scoreTip;
		//背景
		c2d.fillStyle = bgColor;
		c2d.fillRect(0,0,that.dom.width,that.dom.height);
		//文字
		c2d.fillStyle = style.color.reverse;
		c2d.textAlign = "center";
		c2d.textBaseline = "middle";
		//成绩
		c2d.font = font.score;
		offset = pageData.e.score;
		c2d.fillText(TitleList.score, offset.left , offset.top );
		//成绩副标题（新纪录|历史最佳成绩）
		c2d.font = font.scoreSub;
		offset = pageData.e.scoreSub;
		c2d.fillText(TitleList.scoreSub, offset.left , offset.top );
		//炫耀|返回|重来等按钮
		c2d.fillStyle = style.color.normal;
		c2d.font = font.title;
		offset = pageData.e.share;
		c2d.fillText(TitleList.share, offset.left , offset.top);
		offset = pageData.e.exit;
		c2d.fillText(TitleList.exit, offset.left , offset.top);
		offset = pageData.e.again;
		c2d.fillText(TitleList.again, offset.left , offset.top);
		//绘制模式与子模式
		c2d.font = font.mode;
		offset = pageData.e.mode;
		c2d.fillText(TitleList.mode, offset.left , offset.top );
		
		fontTop = offset.top - ((pageData.fontSize.mode+pageData.fontSize.sub)/2 + parseInt(that.dom.height/80))
		fontLeft = offset.left + parseInt(c2d.measureText(TitleList.mode).width/2)
		c2d.font = font.sub;
		c2d.textAlign = "right";
		c2d.fillText(TitleList.sub, fontLeft, fontTop);
		//货币
		c2d.textBaseline = "top";
		c2d.font = font.coin;
		offset = pageData.e.coin;
		c2d.fillText(TitleList.coin , offset.left , offset.top);
		//绘制游戏名、版本
		c2d.textAlign = "left";
		c2d.font = font.gameName;
		offset = pageData.e.gameName;
		c2d.fillText(TitleList.gameName , offset.left , offset.top);
		
		c2d.font = font.ver;
		offset = pageData.e.ver;
		c2d.fillText(TitleList.ver , offset.left , offset.top);
	},
	
	////主进程////
	main : function() {
		var that = this;
		var loop = function() {
			if(that.page == "game")that.runGameData();
			that.execution(that.page); //处理事件回调
			that.drawInterface(that.page); //绘制界面
			that.drawTip(); //绘制提示内容
			that.animationId = window.requestAnimationFrame(loop);
		}
		this.animationId = window.requestAnimationFrame(loop);
	}
	
}



window.onload = function() {
	game = new game();
	game.init();
};