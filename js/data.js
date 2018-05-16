//存储各模式的规则内容
var ruleData = {
	classic : { //经典模式
		block : 4,
		scroll : false,
		two : false,
		pro : false,
		tip : "playTime",
		progressBar : "block",
		require : "block",
		addRequire : "none",
		score : "playTime",
		max : 25,
		sub : [
			{max : 25}, //25
			{max : 50}, //50
			{max : 50, pro : true}, //不连续
			{max : 50, block : 5}, //5*5
			{max : 50, block : 6} //6*6
		]
	},
	arcade : { //街机模式
		block : 4,
		scroll : true,
		two : false,
		pro : false,
		tip : "block",
		progressBar : "none",
		require : "none",
		addRequire : "none",
		score : "block",
		speed : 3.1,
		speedup : 0.02,
		speedMax : 5,
		sub : [
			{speed : 3.1, speedup : 0.02, speedMax : 7}, //正常
			{speed : 4.5, speedup : 0.03, speedMax : 14}, //更快
			{speed : 3.1, speedup : 0.02, speedMax : 7, two : true, pro : true}, //双块
			{speed : 3.1, speedup : 0.02, speedMax : 7, block : 5}, //5*5
			{speed : 3.1, speedup : 0.02, speedMax : 7, block : 6} //6*6
		]
	},
	zen : { //禅模式
		block : 4,
		scroll : false,
		two : false,
		pro : false,
		tip : "block",
		progressBar : "timeLeft",
		require : "time",
		addRequire : "none",
		score : "block",
		timeMax : 15,
		sub : [
			{timeMax : 15}, //15"
			{timeMax : 30}, //30"
			{timeMax : 30, pro : true}, //不连续
			{timeMax : 30, block : 5}, //5*5
			{timeMax : 30, block : 6} //6*6
		]
	},
	rush : { //极速模式
		block : 4,
		scroll : true,
		two : false,
		pro : false,
		tip : "speed",
		progressBar : "none",
		require : "none",
		addRequire : "none",
		score : "speed",
		speed : 3.1,
		speedup : 0.055,
		sub : [
			{speed : 3.1, speedup : 0.055}, //正常
			{speed : 3.1, speedup : 0.055, two : true, pro : true}, //双块
			{speed : 3.1, speedup : 0.055, pro : true}, //不连续
			{speed : 3.1, speedup : 0.055, block : 5}, //5*5
			{speed : 3.1, speedup : 0.055, block : 6} //6*6
		]
	},
	relay : { //接力模式
		block : 4,
		scroll : false,
		two : false,
		pro : false,
		tip : "timeLeft",
		progressBar : "loop",
		require : "loop",
		addRequire : "none",
		score : "block",
		max : 50,
		timeMax : 8,
		sub : [
			{timeMax : 8}, //8"
			{timeMax : 10}, //10"
			{timeMax : 12, pro : true}, //12"
			{timeMax : 10, block : 5}, //5*5
			{timeMax : 10, block : 6} //6*6
		]
	}
}

//语言数据
var languageData = {
	list : [
		"zh-cn",
		"zh-tw"
	],
	misc : {
		bilibiliName : "IceSpirit",
		weiboName : "@Zero_IceSpirit",
		umoniURL : "http://www.umoni.com",
		bilibiliURL : "https://space.bilibili.com/486633",
		weiboURL : "https://weibo.com/xkywr",
		mode : ["classic", "arcade", "zen", "rush", "relay"],
		settings : ["back", "leaderboard", "profile", "sound", "language", "about"],
		symbol : [" ♪", "\"", "/s", ": ", " "] //符号
	},
	"zh-cn" : {
		languageName : "简体中文",
		gameName : "别踩白块儿(钢琴块儿)-仿",
		ver : "Html5 Canvas ver0.17",
		mode : "模式",
		randomMode : "随机",
		settings : "设置",
		back : "返回",
		leaderboard : "排行榜",
		profile : "个人概况",
		sound : "音效",
		language : "语言",
		about : "关于",
		start : "开始",
		share : "炫耀",
		exit : "返回",
		again : "重来",
		best : "历史最佳",
		newBest : "新纪录",
		endGame : "结束",
		playOn : "继续玩",
		noScore : "音符不够",
		noScoreTip : "多玩几轮，踩集更多的音符",
		failed : "败了",
		reset : "重置",
		bestScore : "最佳成绩",
		gamesPlayed : "游戏次数",
		tilesCollected : "踩集块数",
		reScore : "重置将会清空当前所有成绩数据，你确定重置吗？",
		contact : "联系本人",
		subscribe : "不来关注一下我吗？",
		thanks : "感谢原开发团队",
		thanksFor : "Umoni Studio",
		bilibili : "bilibili",
		weibo : "微博",
		modeList : {
			classic : ["经典", ["25","50","不连续","5 x 5","6 x 6"]],
			arcade : ["街机", ["正常","更快","双块","5 x 5","6 x 6"]],
			zen : ["禅", ["15\"","30\"","不连续","5 x 5","6 x 6"]],
			rush : ["极速", ["正常","双块","不连续","5 x 5","6 x 6"]],
			relay : ["接力", ["8\"","10\"","12\"","5 x 5","6 x 6"]]
		},
		soundList : ["默认", "关闭"],
		errorTipCoin : "你的音符♪不够了,再去踩点吧",
		errorTip : [
			"就是饿死,从这跳下去,也不会再继续了！",
			"不要让你家喵主子乱动！",
			"我从未见过如此手残之人！",
			"别放弃挑战哦!",
			"人若无梦想,同咸鱼何异!",
			"你是传奇!",
			"用道具你可以更高分!",
			"为新纪录冲刺吧!",
			"原地复活!高分!高分!",
			"速度快起来!快!快!"
		]
	},
	"zh-tw" : {
		languageName : "繁体中文",
		gameName : "別踩白塊兒(鋼琴塊兒)-仿",
		ver : "Html5 Canvas ver0.17",
		mode : "模式",
		randomMode : "隨機",
		settings : "設置",
		back : "返回",
		leaderboard : "排行榜",
		profile : "個人概況",
		sound : "音效",
		language : "語言",
		about : "關於",
		start : "開始",
		share : "炫耀",
		exit : "返回",
		again : "重來",
		best : "歷史最佳",
		newBest : "新紀錄",
		endGame : "結束",
		playOn : "繼續玩",
		noScore : "音符不夠",
		noScoreTip : "多玩幾輪，踩集更多的音符",
		failed : "敗了",
		reset : "重置",
		bestScore : "最佳成績",
		gamesPlayed : "遊戲次數",
		tilesCollected : "踩集塊數",
		reScore : "重置將會清空當前所有成績數據，你確定重置嗎？",
		contact : "聯繫本人",
		subscribe : "不來關注一下我嗎？",
		thanks : "感謝原開發團隊",
		thanksFor : "Umoni Studio",
		bilibili : "bilibili",
		weibo : "微博",
		modeList : {
			classic : ["經典", ["25","50","不連續","5 x 5","6 x 6"]],
			arcade : ["街機", ["正常","更快","雙塊","5 x 5","6 x 6"]],
			zen : ["禪", ["15\"","30\"","不連續","5 x 5","6 x 6"]],
			rush : ["極速", ["正常","雙塊","不連續","5 x 5","6 x 6"]],
			relay : ["接力", ["8\"","10\"","12\"","5 x 5","6 x 6"]]
		},
		soundList : ["默認", "關閉"],
		errorTipCoin : "你的音符♪不夠了,再去踩點吧",
		errorTip : [
			"就是餓死,從這跳下去,也不會再繼續了！",
			"不要讓你家貓主子亂動！",
			"我從未見過如此手殘之人！",
			"別放弃挑戰哦！",
			"人若無夢想,同鹹魚何异！",
			"你是傳奇！",
			"用道具你可以更高分！",
			"為新紀錄衝刺吧！",
			"原地復活！高分！高分！",
			"速度快起來！快！快！"
		]
	}
}



