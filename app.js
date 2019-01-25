'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('WalletApp');

var express = require('express');
//var session = require('express-session');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
//var util = require('util');
var app = express();
//var expressJWT = require('express-jwt');
//var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
var path = require('path');

var fork = require('child_process').fork;

require('./config.js');
var config = require('./config.json');

var hfc = require('fabric-client');

var helper = require('./app/helper.js');
//var admin_invoke = require('./app/invoke-transaction-admin.js');

//var bitcoin = require('bitcoinjs-lib');
global.addressMap = {};

var wallet = require('./common/wallet.js');
var udo = require('./common/main_chain_init.js')
var plat = require('./common/platform-action.js');
var master_call = require('./common/master-action.js');
var manager_call = require('./common/manager-action.js');
var cc_call = require('./common/chaincode-invoke.js');
var cc_query = require('./common/chaincode-query.js');
var task = require('./common/time-task.js');
var userRouter = require('./routes/user.js');
var gameRouter = require('./common/game-address.js');
var travel = require('./common/travel.js');
var pureland = require('./common/pureland.js');
var bancor = require('./common/bancor.js');

var db = require('./common/mysql_pool')

var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json({
	limit: '60mb'
}));//返回一个只用来解析json格式的中间件
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false,
	limit: '60mb'
}));//返回一个解析body中的urlencoded字符的中间件。

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

// set secret variable
app.set('secret', 'thisismysecret');
// app.use(expressJWT({
// 	secret: 'thisismysecret'
// }).unless({
// 	path: ['/users']
// }));
app.use(bearerToken());

process.TOKENS = [];

//process.setMaxListeners(0);
app.use(function (req, res, next) {
	var language = req.header('language');//语言 zh:中文 en:英文 tw:繁体
	res["language"] = language;
	return next();
});
app.use('/api/user', userRouter);

app.use('/v1/game', gameRouter); 
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('**************  http://' + host + ':' + port +
	'  ******************');
server.timeout = 240000;
///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

//区块事件监听
//task.blockListener();//必须先启动，否则有可能导致区块丢失

//手续费返还任务
//task.takeOffGasReturn();

//更新合约状态
//task.updateContractStatus();

//处理区块事件监听失败的记录
//task.syncBlockExtInfo();

//启动新的进程清理日志
function cleanLog() {
	var worker = fork('./common/clean-log.js') //创建一个工作进程
	worker.on('message', function (m) {//接收到工作进程的计算结果
		if ('object' === typeof m) {
			worker.kill();//发送杀死进程的信号
		}
	});
	//发送给工作进程数据
	worker.send({ action: 'start' });
}
cleanLog();

//chain enter apply 
app.post('/v1/wallet/udo_chainEnter', function (req, res) {
	plat.chainEnter(req,res);
});

//commit enter info
app.post('/v1/wallet/udo_chainEnterCommit', function (req, res) {
	plat.chainEnterCommit(req, res);
});

//modify chain enter info
app.post('/v1/wallet/udo_chainEnterUpdate', function (req, res) {
	plat.chainEnterUpdate(req,res);
});

//chain enter info query
app.post('/v1/wallet/udo_chainEnterSearch', function (req, res) {
	plat.chainEnterSearch(req,res);
});

//delete enter info
app.post('/v1/wallet/udo_chainEnterDelete', function (req, res) {
	plat.chainEnterDelete(req,res);
});

//chain enter info query by id
app.get('/v1/wallet/udo_chainEnterInfo/:id', function (req, res) {
	plat.chainEnterInfo(req,res);
});

//deploye chaincode
app.post('/v1/wallet/udo_cc_deploye', function (req, res) {
	plat.deployeCC(req, res,false);
});

//deploye chaincode with url
app.post('/v1/wallet/cc_deploye_url', function (req, res) {
	plat.deployeCC(req, res,true);
});

//Instantiate other user chaincode
app.post('/v1/wallet/udo_cc_init', function (req, res) {
	plat.instantiateCC(req, res);
});

//upgrade other user chaincode
app.post('/v1/wallet/udo_cc_upgrade', function (req, res) {
	plat.upgradeCC(req, res,false);
});

//upgrade other user chaincode with url
app.post('/v1/wallet/cc_upgrade_url', function (req, res) {
	plat.upgradeCC(req, res,true);
});


//delete other user chaincode
app.post('/v1/wallet/udo_cc_delete', function (req, res) {
	plat.deleteCC(req, res);
});

//query other user chaincode
app.post('/v1/wallet/udo_cc_query', function (req, res) {
	plat.ccSearch(req,res);
});

//query other user chaincode info
app.get('/v1/wallet/udo_cc_info/:address/:version', function (req, res) {
	plat.ccInfo(req, res);
});

//query master and manager of token
app.get('/v1/wallet/querySignInfoByToken/:tokenID', function (req, res) {
	plat.querySignInfoByToken(req, res);
})

//query managers of token
app.get('/v1/wallet/queryManagerList/:tokenID', function (req, res) {
	plat.queryManagerList(req, res);
})

// Create Channel
app.post('/channels', function (req, res) {
	udo.createChannel(req,res);
});

// Join Channel
app.post('/channels/:channelName/peers', function (req, res) {
	udo.joinChannel(req,res);
});

// Install chaincode on target peers
app.post('/chaincodes', function (req, res) {
	udo.installChaincode(req,res);
});


// Upgrade chaincode on target peers
app.post('/upgrade', function (req, res) {
	udo.upgradeCahincode(req, res);
});

// Instantiate chaincode on target peers
app.post('/v1/wallet/init', function (req, res) {
	udo.instantiateChaincode(req, res);
});

//在区块链上创建新钱包地址
app.get('/v1/wallet/new', function (req, res) {
	cc_call.createWallet(req,res);
});

//未上区块链的钱包地址
app.get('/v1/wallet/withNoNet', function (req, res) {
	res.json(wallet.newWallet());
});

//设置master及manager
app.post('/v1/wallet/udo_provideAuthority', async function (req, res) {
	cc_call.provideAuthority(req,res);
});

//设置公钥
app.post('/v1/wallet/updateWalletPubkey', async function (req, res) {
	cc_call.updateWalletPubkey(req,res);
});

//暂停某些方法
app.post('/v1/wallet/pause', async function (req, res) {
	master_call.pause(req,res);
});

//恢复暂停的某些方法
app.post('/v1/wallet/resume', async function (req, res) {
	master_call.resume(req,res);
});

app.post('/v1/wallet/setMajorityThreshold', async function (req, res) {
	master_call.setMajorityThreshold(req,res);
});

app.post('/v1/wallet/setMasterThreshold', async function (req, res) {
	master_call.setMasterThreshold(req, res);
});

app.post('/v1/wallet/udo_replaceManager', async function (req, res) {
	master_call.replaceManager(req,res);
});

app.post('/v1/wallet/udo_removeManager', async function (req, res) {
	master_call.removeManager(req,res);
});

app.post('/v1/wallet/udo_addManager', async function (req, res) {
	master_call.addManager(req,res);
});

app.post('/v1/wallet/udo_confirm', async function (req, res) {
	manager_call.confirm(req,res);
});

app.post('/v1/wallet/queryConfirmInfo', async function (req, res) {
	cc_query.queryConfirmInfo(req, res);
});

app.post('/v1/wallet/udo_revoke', async function (req, res) {
	manager_call.revoke(req,res);
});

//发行TOKEN
app.post('/v1/wallet/udo_issueToken', async function (req, res) {
	plat.issueToken(req, res);
});

//禁用合约
app.post('/v1/wallet/udo_cc_disable', async function (req, res) {
	plat.disableContract(req,res);
});

//启用合约
app.post('/v1/wallet/udo_cc_enable', async function (req, res) {
	plat.enableContract(req, res);
});

app.post('/v1/wallet/udo_publishTokenRequireNum', async function (req, res) {
	manager_call.setRequireNum(req, res, "publishTokenRequireNum");
});

app.post('/v1/wallet/udo_publishCCRequireNum', async function (req, res) {
	manager_call.setRequireNum(req, res,"publishCCRequireNum");
});

app.post('/v1/wallet/udo_createChainRequireNum', async function (req, res) {
	manager_call.setRequireNum(req, res, "createChainRequireNum");
})

app.post('/v1/wallet/udo_returnGasConfig', async function (req, res) {
	manager_call.returnGasConfig(req,res);
});

app.get('/v1/wallet/udo_queryReturnGasConfig', async function (req, res) {
	plat.queryReturnGasConfig(req,res);
});

app.get('/v1/wallet/udo_queryPublishTokenRequireNum', async function (req, res) {
	plat.queryPublishTokenRequireNum(req,res);
});

app.get('/v1/wallet/udo_queryPublishCCRequireNum', async function (req, res) {
	plat.queryPublishCCRequireNum(req,res);
});


// Invoke transaction on chaincode on target peers
app.post('/ccode_invoke/:account', async function (req, res) {
	cc_call.ccInvoke(req,res);
});
// Query on chaincode on target peers
app.get('/ccode_query/:account', async function (req, res) {
	cc_query.cc_query_get(req,res);
});

app.post('/ccode_query/:account', async function (req, res) {
	cc_query.cc_query_post(req, res);
});


app.post('/v1/wallet/presaleVesting', async function (req, res) {
	manager_call.presaleVesting(req,res);
});

app.post('/v1/wallet/batchPresaleVesting', async function (req, res) {
	manager_call.batchPresaleVesting(req,res);
});

app.post('/v1/wallet/presale', async function (req, res) {
	manager_call.presale(req,res);
});

app.post('/v1/wallet/batchPresale', async function (req, res) {
	manager_call.batchPresale(req,res);
});

app.post('/v1/wallet/transferFrom', async function (req, res) {
	cc_call.transferFrom(req,res);
});

app.post('/v1/wallet/approve', async function (req, res) {
	cc_call.approve(req,res);
});

//发行名人TOKEN
app.post('/v1/wallet/issueToken', async function (req, res) {
	manager_call.issueToken(req,res);
});

//增发TOKEN seasoned new issue
app.post('/v1/wallet/udo_seoToken', async function (req, res) {
	manager_call.seoToken(req,res)
});

//添加释放计划
app.post('/v1/wallet/tokenReleasePlan', async function (req, res) {
	manager_call.tokenReleasePlan(req,res);
});

//锁定某钱包下面的token
app.post('/v1/wallet/lockToken', async function (req, res) {
	manager_call.lockToken(req,res);
});

//解锁token
app.post('/v1/wallet/unlockToken', async function (req, res) {
	manager_call.unlockToken(req,res);
});

//锁定钱包
app.post('/v1/wallet/lockWallet', async function (req, res) {
	manager_call.lockWallet(req,res);
});

//解锁钱包
app.post('/v1/wallet/unlockWallet', async function (req, res) {
	manager_call.unlockWallet(req,res);
});

//设置token状态
app.post('/v1/wallet/updateTokenStatus', async function (req, res) {
	manager_call.updateTokenStatus(req,res);
});

//转账
app.post('/v1/wallet/sendRawTransaction', async function (req, res) {
	cc_call.sendRawTransaction(req,res);
	/*
	var data = req.body.rawData;
	if (!data) {
		res.json({
			status: false,
			msg: '请求参数错误!'
		});
		return;
	}

	var jsonObj = null;
	try {
		var rawData = wallet.hexToStringWide(data);
		jsonObj = JSON.parse(rawData);
	} catch (err) {
		res.json({
			status: false,
			msg: err
		});
		return;
	}

	var origin = jsonObj.origin;

	//同一个人给多人转账时，需排队进行
	if (global.addressMap[origin.fromAddress] == true
		|| global.addressMap[origin.toAddress] == true) {
		await wallet.ZtSleep.sleep(1500);
	}
	global.addressMap[origin.fromAddress] = true;
	global.addressMap[origin.toAddress] = true;

	var worker = fork('./common/work.js') //创建一个工作进程
	worker.on('message', function (m) {//接收工作进程计算结果
		if ('object' === typeof m) {
			worker.kill();//发送杀死进程的信号

			delete global.addressMap[origin.fromAddress];
			delete global.addressMap[origin.toAddress];
			db.syncQuery("INSERT INTO t_test(content) VALUES(?)", [JSON.stringify(m)]);
			res.json(m);//将结果返回客户端
		}
	});
	worker.send({ data: data });
	//发送给工作进程进行转账
	*/
});

//多token多地址转账
app.post('/v1/wallet/multiTokenTransfer', async function (req, res) {
	cc_call.multiTokenTransfer(req,res);
});

//单token多地址转账
app.post('/v1/wallet/multiTransfer', async function (req, res) {
	cc_call.multiTransfer(req,res);
});

//更新手续费
app.post('/v1/wallet/updateChargeGas', function (req, res) {
	manager_call.updateChargeGas(req,res);
});

//获取钱包信息
app.get('/v1/wallet/queryBalance/:address', function (req, res) {
	cc_query.queryBalance(req,res);
});

app.get('/v1/wallet/queryTransferHistoryInfo/:txId', function (req, res) {
	cc_query.queryTransferHistoryInfo(req, res);
});

app.get('/v1/wallet/queryTransferStatus/:txId', function (req, res) {
	cc_query.queryTransferStatus(req, res);
});

app.post('/v1/wallet/queryMultiTransferStatus', function (req, res) {
	cc_query.queryMultiTransferStatus(req, res);
});

//查询某地址是否是master或manager
app.get('/v1/wallet/isMaterOrManagerOfAddr/:address/:tokenID', function (req, res) {
	cc_query.isMaterOrManagerOfAddr(req, res);
});

//获取detal信息
app.post('/v1/wallet/getVar', function (req, res) {
	cc_query.getVar(req,res);
});

//钱包是否已经在帐本中
app.get('/v1/wallet/walletIsExist/:address', function (req, res) {
	cc_query.walletIsExist(req,res);
});

//获取manager个数
app.get('/v1/wallet/managersCount/:tokenID', function (req, res) {
	cc_query.managerCount(req,res);
});

//是否具有manager的权限
app.post('/v1/wallet/isAddressManager', function (req, res) {
	cc_query.isAddressManager(req,res);
});

app.get('/v1/wallet/getMajorityThreshold/:tokenID', function (req, res) {
	cc_query.getMajorityThreshold(req,res);
});

app.post('/v1/wallet/isConfirmed', function (req, res) {
	cc_query.isConfirmed(req,res);
});

app.post('/v1/wallet/isConfirmedBy', function (req, res) {
	cc_query.isConfirmedBy(req,res);
});

app.post('/v1/wallet/isMajorityConfirmed', function (req, res) {
	cc_query.isMajorityConfirmed(req,res);
});

app.post('/v1/wallet/vestingFunc', function (req, res) {	
	cc_query.vestingFunc(req,res);
});

app.get('/v1/wallet/queryWithdrawed/:address/:id', function (req, res) {
	cc_query.queryWithdrawed(req,res);
});

app.post('/v1/wallet/hexToNumber', function (req, res) {
	cc_query.hexToNumber(req,res);
});

app.post('/v1/wallet/queryVestingRemain', function (req, res) {
	let fcn = 'queryVestingRemain';
	var address = req.body.address;
	var currentTime = req.body.currentTime;
	var id = req.body.id;
	var args = [];
	args.push(address);
	args.push(currentTime+"");
	args.push(id + "");
	wallet.platQuery(fcn, args, res);
});

app.post('/v1/wallet/vestingsBalance', function (req, res) {
	cc_query.vestingsBalance(req, res);
});

app.post('/v1/wallet/vestingsBalanceDetail', function (req, res) {
	cc_query.vestingsBalanceDetail(req, res);
});

app.post('/v1/wallet/queryVestingInfo', function (req, res) {
	cc_query.queryVestingInfo(req, res);
});

app.post('/v1/wallet/balanceOf', function (req, res) {
	cc_query.balanceOf(req,res);
});

app.post('/v1/wallet/allowance', function (req, res) {
	cc_query.allowance(req,res);
});

//获取token信息
app.get('/v1/wallet/queryTokenInfo/:tokenID', function (req, res) {
	cc_query.queryTokenInfo(req,res);
});

//获取发行token所使用的钱包地址
app.get('/v1/wallet/queryMasterAdressOfToken/:tokenID', function (req, res) {
	cc_query.queryMasterAdressOfToken(req, res);
});

//获取主币信息
app.get('/v1/wallet/queryMasterTokenInfo', function (req, res) {
	cc_query.queryMasterTokenInfo(req, res);
});

//获取某一token下面的所有钱包
app.get('/v1/wallet/queryWalletsByToken/:tokenID', function (req, res) {
	cc_query.queryWalletsByToken(req,res);
});

//获取某一token下面的所有交易
app.get('/v1/wallet/queryTxsByToken/:tokenID', function (req, res) {
	let tokenID = req.params.tokenID;
	let fcn = 'queryTxsByToken';
	wallet.platQuery(fcn, tokenID, res);
});

//获取某一钱包下面的所有交易（主要是钱包信息变动交易）
app.get('/v1/wallet/queryTxsByAddress/:address', function (req, res) {
	let address = req.params.address;
	let fcn = 'queryTxsByAddress';
	wallet.platQuery(fcn, address, res);
});

//获取某一笔多地址转账的详情
app.post('/v1/wallet/queryMultiTxInfo', function (req, res) {
	let txId = req.body.txId;
	let fcn = 'queryMultiTxInfo';
	wallet.platQuery(fcn, txId, res);
});

//查询某一笔转账详情
app.post('/v1/wallet/queryTransferDetails', function (req, res) {
	let txId = req.body.txId;
	let fcn = 'queryTransferDetails';
	wallet.platQuery(fcn, txId, res);
});

//查询某一地址下所有交易
app.get('/v1/wallet/queryTransferInfos/:address', function (req, res) {
	let address = req.params.address;
	let fcn = 'queryTransferInfos';
	wallet.platQuery(fcn, address, res);
});

//查询某一地址下所有转账交易记录数
app.get('/v1/wallet/queryTransferCount/:address', function (req, res) {
	cc_query.queryTransferCount(req,res);
});

//查询转账交易手续费
app.get('/v1/wallet/queryChargeGas', function (req, res) {
	cc_query.queryChargeGas(req,res);
});

//查询手续费地址
app.get('/v1/wallet/queryGasAddress', function (req, res) {
	cc_query.queryGasAddress(req, res);
});

//根据钱包地址获取公钥
app.get('/v1/wallet/queryPublicKey/:address',async function (req,res) {
	var chaincodeName = config.chaincodeName;
	var channelName = config.channelName;
	cc_query.getPublickKey(req, res, chaincodeName, channelName);
});

//  Query Get Block by BlockNumber
app.get('/v1/wallet/blocks/:blockId', function(req, res) {
	cc_query.getBlockInfo(req,res);
});

//  Query block extra info
app.get('/v1/wallet/queryBlockExtInfo/:id', function (req, res) {
	plat.queryBlockExtInfo(req, res);
});

//  Query take off gas of transaction
app.get('/v1/wallet/queryGasRecords/:number/:pageSize', function (req, res) {
	plat.queryGasRecords(req, res);
});

//  Returns the number of transactions in a block from a block matching the given block hash.
app.post('/v1/wallet/getBlockTransactionCountByHash', function (req, res) {
	cc_query.getBlockTransactionCountByHash(req,res);
});

//  Query Get Block by BlockNumber
app.get('/v1/wallet/getBlockTransactionCountByNumber/:blockId', function (req, res) {
	cc_query.getBlockTransactionCountByNumber(req,res);
});

// Query Get Transaction by Transaction ID
app.post('/v1/wallet/getTransactionByHash', function (req, res) {
	cc_query.getTransactionByHash(req,res);
});

//  Query Get ChainInfo
app.get('/v1/wallet/getChainInfo', function (req, res) {
	cc_query.getChainInfo(req,res);
});

app.get('/v1/wallet/getBlockNumber', function (req, res) {
	cc_query.getBlockNumber(req,res);
});

//  Returns information about a transaction by block hash and transaction index position.
app.post('/v1/wallet/getTransactionByBlockHashAndIndex', function (req, res) {
	cc_query.getTransactionByBlockHashAndIndex(req,res);
});

// Returns information about a transaction by block number and transaction index position.
app.post('/v1/wallet/getTransactionByBlockNumberAndIndex', function (req, res) {
	cc_query.getTransactionByBlockNumberAndIndex(req,res);
});

// Returns information about a transaction by block number and transaction index position.
app.get('/v1/wallet/test', function (req, res) {
	task.testCleanLog();
	res.json({status:true,msg:"清理日志"});
	/*var originStr = req.body.origin;
	var pubKey = req.body.pubKey;
	var signature = req.body.signature;
	
	let bl = wallet.verify(originStr, signature, pubKey);
	res.json(bl);*/
});

//增加用户
app.post('/v1/travel/addTravelUser', function (req, res) {
	travel.addTravelUser(req,res);
});

//获取用户信息
app.get('/v1/travel/queryTravelUser/:address', function (req, res) {
	travel.queryTravelUser(req,res);
});

//修改用户身份信息
app.post('/v1/travel/modifyTravelUserInfo', function (req, res) {
	travel.modifyTravelUserInfo(req,res);
});

//增加软文
app.post('/v1/travel/addTravelSoftText', function (req, res) {
	travel.addTravelSoftText(req,res);
});

//删除软文
app.post('/v1/travel/delTravelSoftText', function (req, res) {
	travel.delTravelSoftText(req,res);
});

//修改软文图片链接地址
app.post('/v1/travel/modifyTravelSoftTextImageUrl', function (req, res) {
	travel.modifyTravelSoftTextImageUrl(req,res);
});

//获取软文信息
app.get('/v1/travel/queryTravelSoftText/:softTextID', function (req, res) {
	travel.queryTravelSoftText(req,res);
});

//获取软文信息列表
app.get('/v1/travel/queryTravelSoftTextList/:address', function (req, res) {
	travel.queryTravelSoftTextList(req,res);
});

//增加游记
app.post('/v1/travel/addTravelNote', function (req, res) {
	travel.addTravelNote(req,res);
});

//删除游记
app.post('/v1/travel/delTravelNote', function (req, res) {
	travel.delTravelNote(req,res);
});

//修改游记图片链接地址
app.post('/v1/travel/modifyTravelNoteImageUrl', function (req, res) {
	travel.modifyTravelNoteImageUrl(req,res);
});

//获取游记信息
app.get('/v1/travel/queryTravelNote/:travelNoteID', function (req, res) {
	travel.queryTravelNote(req,res);
});

//获取游记信息列表
app.get('/v1/travel/queryTravelNoteList/:address', function (req, res) {
	travel.queryTravelNoteList(req,res);
});

//增加短视频
app.post('/v1/travel/addTravelShortVideo', function (req, res) {
	travel.addTravelShortVideo(req,res);
});

//删除短视频
app.post('/v1/travel/delTravelShortVideo', function (req, res) {
	travel.delTravelShortVideo(req,res);
});

//修改短视频链接地址
app.post('/v1/travel/modifyTravelShortVideoUrl', function (req, res) {
	travel.modifyTravelShortVideoUrl(req,res);
});

//获取短视频信息
app.get('/v1/travel/queryTravelShortVideo/:shortVideoID', function (req, res) {
	travel.queryTravelShortVideo(req,res);
});

//获取短视频信息列表
app.get('/v1/travel/queryTravelShortVideoList/:address', function (req, res) {
	travel.queryTravelShortVideoList(req,res);
});

//增加评论
app.post('/v1/travel/addTravelComment', function (req, res) {
	travel.addTravelComment(req,res);
});

//获取评论信息
app.get('/v1/travel/queryTravelComment/:commentID', function (req, res) {
	travel.queryTravelComment(req,res);
});

//获取评论列表通过软文ID，游记ID，短视频ID查找
app.get('/v1/travel/queryTravelCommentList/:subjectID', function (req, res) {
	travel.queryTravelCommentList(req,res);
});

//获取评论列表通过地址查找
app.get('/v1/travel/queryTravelCommentListByAddress/:address', function (req, res) {
	travel.queryTravelCommentListByAddress(req,res);
});

//增加点赞
app.post('/v1/travel/addTravelLike', function (req, res) {
	travel.addTravelLike(req,res);
});

//获取点赞列表通过软文ID，游记ID，短视频ID查找
app.get('/v1/travel/queryTravelLikeList/:subjectID', function (req, res) {
	travel.queryTravelLikeList(req,res);
});

//增加阅读量
app.post('/v1/travel/addTravelAmountOfReading', function (req, res) {
	travel.addTravelAmountOfReading(req,res);
});

//获取阅读量列表通过软文ID，游记ID，短视频ID查找
app.get('/v1/travel/queryTravelAmountOfReadingList/:subjectID', function (req, res) {
	travel.queryTravelAmountOfReadingList(req,res);
});

//增加邀请人
app.post('/v1/travel/addTravelInvite', function (req, res) {
	travel.addTravelInvite(req,res);
});

//获取邀请人列表
app.get('/v1/travel/queryTravelInviteList/:address', function (req, res) {
	travel.queryTravelInviteList(req,res);
});

//获取被谁邀请
app.get('/v1/travel/queryTravelBeInvited/:address', function (req, res) {
	travel.queryTravelBeInvited(req,res);
});
//房产链
//对钱包地址设置多重签名，包括阈值和manager地址
app.post('/v1/pureland/pldWalletTokenProvideAuthority', function (req, res) {
	pureland.pldWalletTokenProvideAuthority(req,res);
});

//签名
app.post('/v1/pureland/pldWalletTokenConfirm', function (req, res) {
	pureland.pldWalletTokenConfirm(req,res);
});

//撤销签名
app.post('/v1/pureland/pldWalletTokenRevoke', function (req, res) {
	pureland.pldWalletTokenRevoke(req,res);
});

//增加manager
app.post('/v1/pureland/pldWalletTokenAddManager', function (req, res) {
	pureland.pldWalletTokenAddManager(req,res);
});

//删除manager
app.post('/v1/pureland/pldWalletTokenRemoveManager', function (req, res) {
	pureland.pldWalletTokenRemoveManager(req,res);
});

//查询钱包地址的多重签名信息
app.get('/v1/pureland/pldWalletTokenQueryAuthority/:address/:tokenID', function (req, res) {
	pureland.pldWalletTokenQueryAuthority(req,res);
});

//查询签名信息
app.post('/v1/pureland/pldWalletTokenQueryConfirmInfo', function (req, res) {
	pureland.pldWalletTokenQueryConfirmInfo(req,res);
});

//设置钱包地址的签名阈值
app.post('/v1/pureland/pldWalletTokenSetManagerThreshold', function (req, res) {
	pureland.pldWalletTokenSetManagerThreshold(req,res);
});

//一对一转账
app.post('/v1/pureland/pldTransfer', function (req, res) {
	pureland.pldTransfer(req,res);
});

//一对多转账
app.post('/v1/pureland/pldMultiTransfer', function (req, res) {
	pureland.pldMultiTransfer(req,res);
});

//授权转账
app.post('/v1/pureland/pldApprove', function (req, res) {
	pureland.pldApprove(req,res);
});

//发行token
app.post('/v1/pureland/pldIssueToken', function (req, res) {
	pureland.pldIssueToken(req,res);
});

//设置发行token所需手续费大小
app.post('/v1/pureland/pldSetIssueTokenGas', function (req, res) {
	pureland.pldSetIssueTokenGas(req,res);
});

//查询发行token所需手续费大小
app.get('/v1/pureland/pldQueryIssueTokenGas', function (req, res) {
	pureland.pldQueryIssueTokenGas(req,res);
});

//发布智能合约
app.post('/v1/pureland/pldDeployCC', function (req, res) {
	pureland.pldDeployCC(req,res);
});

//初始化合约
app.post('/v1/pureland/pldInstantiateCC', function (req, res) {
	pureland.pldInstantiateCC(req,res);
});

//升级合约
app.post('/v1/pureland/pldUpgradeCC', function (req, res) {
	pureland.pldUpgradeCC(req,res);
});

// Query on chaincode on target peers
app.post('/v1/pureland/pldChaincodeQuery/:account', async function (req, res) {
	pureland.pldChaincodeQuery(req,res);
});

// Invoke transaction on chaincode on target peers
app.post('/v1/pureland/pldChaincodeInvoke/:account', async function (req, res) {
	pureland.pldChaincodeInvoke(req,res);
});

//删除合约
app.post('/v1/pureland/pldDeleteContract', function (req, res) {
	pureland.pldDeleteContract(req,res);
});

//设置实例化合约部所需手续费大小
app.post('/v1/pureland/pldSetInstantiateContractGas', function (req, res) {
	pureland.pldSetInstantiateContractGas(req,res);
});

//查询实例化合约部所需手续费大小
app.get('/v1/pureland/pldQueryInstantiateContractGas', function (req, res) {
	pureland.pldQueryInstantiateContractGas(req,res);
});

//设置执行合约部所需手续费大小
app.post('/v1/pureland/pldSetInvokeContractGas', function (req, res) {
	pureland.pldSetInvokeContractGas(req,res);
});

//查询执行合约部所需手续费大小
app.get('/v1/pureland/pldQueryInvokeContractGas', function (req, res) {
	pureland.pldQueryInvokeContractGas(req,res);
});

//发行智能token
app.post('/v1/bancor/issueSmartToken', function (req, res) {
	bancor.issueSmartToken(req,res);
});

//购买智能token
app.post('/v1/bancor/purchaseSmartToken', function (req, res) {
	bancor.purchaseSmartToken(req,res);
});

//出售智能token
app.post('/v1/bancor/saleSmartToken', function (req, res) {
	bancor.saleSmartToken(req,res);
});

//查询智能token
app.get('/v1/bancor/querySmartToken/:tokenId', function (req, res) {
	bancor.querySmartToken(req,res);
});
