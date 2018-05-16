var game = function() {
	this.name = "DontTapTheWhiteTile";
	this.cid = "canvas";
	this.c2d = null;
	this.canvas = null;
	this.animationId = null;
	this.audioContext = null;
	this.domPage = "about";
	this.page = "menu";
	this.pageName = ["menu", "game", "settings", "end"];
	this.language = languageData;
	this.rule = ruleData;
	this.img = { //预存储图片
		umoni: new Image(),
		bilibili: new Image(),
		weibo: new Image()
	};
	this.img.umoni.src = "./image/umoni.png";
	this.img.bilibili.src = "./image/bilibili.png";
	this.img.weibo.src = "./image/weibo.png";
	this.sound = {
		click : "./sound/click.mp3",
		error : "./sound/error.mp3",
		timeEnd : "./sound/timeEnd.mp3",
		victory : "./sound/victory.mp3"
	};
	this.score = { //积分相关数据，启动后初始化
		coin : 0, //货币
		bestScore : null, //各模式最佳成绩
		gamesPlayed : null, //各模式游戏次数
		tilesCollected : null, //各模式踩集次数
		leaderboard : null //排行榜数据（街机|极速）
	};
	this.b = { //存储方块相关属性
		width : null, height : null, //方块宽度高度
		mode : null, sub : 0, subPos : 0, //模式，子模式，子模式位置
		clickTime : 12, frameTimeMax : 34, //点击后覆盖点击颜色的帧数，执行一帧所计算的最大时间
		run : { //运行数据
			gameStart : false, //游戏开始状态
			errorState : false, //游戏错误状态
			subScoll : { //子模式滚动状态
				on : false,
				startTime : 0,
				startPos : 0,
				startLeft : 0,
				startTop : 0,
				subWidth : 0
			},
			rule : {}, //规则
			time : { //运行时间数据
				start : null, //启动时间
				run : null, //运行时间
				currRun : null, //游戏内容运行时间
				last : null, //上一帧时间
				curr : null, //当前帧时间
				interval : null //本帧间隔
			},
			list : null, //方块列表
			listMax : null, //列表长度
			listPos : null, //当前列表位置
			runPos : null, //屏幕位置
			lastPos : null, //当前屏幕最下方一行
			score : null, //点击块数
			timeLeft : null, //剩余时间
			speed : null, //滚屏速度
			pause : null, //暂停开关
			error : { //错误属性
				listPos : -1, //列表位置
				pos : -1, //行位置
				frame : 0, //动画帧数
				coinDemand : 0, //需求积分
				errorTip : "" //友情提示内容
			},
			errorNum : 0, //失误次数
			endColor : null, //结算背景色
			placeholder : null, //预留方块高度
			currScore : { //最佳成绩
				score : "",
				scoreTip : ""
			}
		}
	};
	this.dom = { //存储需要使用到的dom数据
		htmlWidth : null, htmlHeight : null, //网页显示区域的宽高
		width : null, height : null, //游戏界面(canvas)的宽高
		offsetLeft : null, offsetTop : null, //游戏界面(canvas)在网页中的偏移像素
		scrollLeft : null, scrollLeft : null, //页面滚动条所在位置
		domList : document.getElementById("domList"),
		dTop : document.getElementById("dTop"),
		dReturn : document.getElementById("dReturn"),
		dTopTitle : document.getElementById("dTopTitle"),
		dReset : document.getElementById("dReset"),
		dContent : document.getElementById("dContent")
	};
	this.style = { //样式预置，但是否应当这样……
		fontName : "Microsoft YaHei",
		width : 1080, //原始宽高，字体根据宽度比例，其他根据对应比例
		height : 1920,
		scale : { //缩放比例
			width : 1,
			height : 1
		},
		color : { //基础颜色
			normal : "#FFFFFF",
			reverse : "#000000"
		},
		tip : {},
		//模式菜单样式内容
		menu : {
			color : {
				settings : "#AAAAAA"
			},
			font : {
				title : {size : 90, bold:true},
				coin : {size : 43, bold:true},
			},
			e : {
				button : { width:540, height:640, fontLeft:270, fontTop:320 },
				coin : { left:1070, top:10 }
			}
		},
		//游戏界面样式内容
		game : {
			color : {
				line : "rgba(34,34,34,0.6)",
				bg : "#F5F5F5",
				block : "rgb(120, 220, 250)",
				onblock : "rgba(255,255,255,0.75)",
				error : "#F55",
				gameTip : "#F33",
				gameTipS : "rgba(34,34,34,0.5)",
				subBg : "#F9E718",
				onsubBg : "#000",
				sub : "#000",
				onsub : "#FFF",
				victory : "#5D7",
				ProgressBar : [
					{r : 255, g : 30, b : 30}, //红色
					{r : 255, g : 255, b : 0}, //黄色
					{r : 80, g : 255, b : 80} //绿色
				],
				ProgressBarS : "rgba(100,100,100,0.4)",
				gray : "#CACACA",
				shadow : "rgba(0,0,0,0.55)"
			},
			font : {
				gameTip : {size:90, bold : true},
				sub : {size:60, bold : true},
				start : {size:90, bold : true}, //注：该样式需特别计算，在setPageData里注意
				errorTip : {size:54, bold : true},
				errorTitle : {size:200, bold : true},
				errorTitleSub : {size:70, blod : true},
				button : {size:60},
				onbutton : {size:70},
				coin : {size:48}
			},
			e : {
				sub : { width:336, height:384, fontLeft:168, fontTop:192, marginRight:2},
				gameTip : { left:540, top:77 },
				blockTip : { left:135, top:240 },//注：该样式需特别计算，在setPageData里注意
				//失败界面内容设定
				errorShadow : { left:54, top:474 ,width:972, height:972, radius:97 },
				errorBg : { left:68, top:487 ,width:946, height:946, radius:94 },
				errorTipBg : { left:108, top:530, width:864, height:120, radius:43 },
				buttonOut : { left:118, top:1178, width:388, height:194, radius:38, lineWidth:2, fontLeft:312, fontTop:1272 },
				buttonGo: { left:583, top:1178, width:388, height:194, radius:38, fontLeft:777, fontTop:1240, fontTopB:1313 },
				errorTip : { left:540, top:590 },
				errorTitle : { left:540, top:821 },
				errorSubTitle : { left:540, top:1048 }
			}
		},
		//设置页面样式内容
		settings : {
			font : {
				title : {size:60, bold : true}
			},
			e : {
				button : { width:540, height:640, fontLeft:270, fontTop:320 }
			}
		},
		//结算页面样式内容
		end : {
			font : {
				gameName : {size:37},
				coin : {size:43, bold : true},
				mode : {size:120},
				sub : {size:40, bold : true},
				score : {size:170, bold : true},
				scoreSub : {size:78, bold : true},
				title : {size:78},
				ver : {size:33}
			},
			e : {
				gameName : { left:10, top:28 },
				coin : { left:1070, top:28 },
				mode : { left:540, top:384 },
				score : { left:540, top:790 },
				scoreSub : { left:540, top:970 },
				share : { left:306, top:1324 },
				exit : { left:540, top:1324 },
				again : { left:774, top:1324 },
				ver : { left:22, top:1843 }
			}
		}
	};
	this.flags = {
		language : "zh-cn",
		sound : 0,
		lastMode : {} //记录最后一次游玩时该模式的子模式
	};
	this.pageData = {}; //存储页面需要用到的数据信息
	this.state = {}; //存储接收的交互状态
	this.eventState = {}; //存储event上次触发的消息内容
	this.handlers = {}; //存储再封装的事件函数，可用于撤销
	this.logList = { //存储一些需要输出的消息
		tip : {text:"", alpha:0}
	};
	this.disableInput = {t:new Date().getTime(), l:700}; //禁用操作的时长
}