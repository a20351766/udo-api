/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');

var path = require('path');
var fs = require('fs-extra');
const YAML = require('yamljs');
var util = require('util');

var api = require('fabric-client/lib/api.js');
var gm = require('../common/crypto-sm2.js')
var EC = require('elliptic').ec;
var crypto = require('crypto');

var hfc = require('fabric-client');
hfc.setLogger(logger);

async function getClientForOrg(userorg, username) {
	// get a udo client loaded with a connection profile for this org
	let config = '-connection-profile-path';

	// build a client context and load it with a connection profile
	// lets only load the network settings and save the client for later
	let client = hfc.loadFromConfig(hfc.getConfigSetting('network' + config));

	// This will load a connection profile over the top of the current one one
	// since the first one did not have a client section and the following one does
	// nothing will actually be replaced.
	// This will also set an admin identity because the organization defined in the
	// client section has one defined
	client.loadFromConfig(hfc.getConfigSetting(userorg + config));

	// this will create both the state store and the crypto store based
	// on the settings in the client section of the connection profile
	await client.initCredentialStores();

	// The getUserContext call tries to get the user from persistence.
	// If the user has been saved to persistence then that means the user has
	// been registered and enrolled. If the user is found in persistence
	// the call will then assign the user to the client object.
	if (username) {
		let user = await client.getUserContext(username + userorg, true);
		if (!user) {
			var retObj = await loadUser(username, userorg, client);
			if (retObj.status == false) {
				throw new Error(retObj.msg);
			}
		} else {

		}
	}

	return client;
}

var getRegisteredUser = async function (username, userOrg, isJson) {
	try {
		var client = await getClientForOrg(userOrg);
		// client can now act as an agent for organization Org1
		// first check to see if the user is already enrolled
		var user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
		} else {
			// user was not enrolled, so we will need an admin user object to register
			logger.info('User %s was not enrolled, so we will need an admin user object to register', username);
			var admins = hfc.getConfigSetting('admins');
			let adminUserObj = await client.setUserContext({ username: admins[0].username, password: admins[0].secret });
			let caClient = client.getCertificateAuthority();
			let secret = await caClient.register({
				enrollmentID: username,
				affiliation: userOrg.toLowerCase() + '.department1'
			}, adminUserObj);
			user = await client.setUserContext({ username: username, password: secret });
		}
		if (user && user.isEnrolled) {
			if (isJson && isJson === true) {
				var response = {
					status: true,
					secret: user._enrollmentSecret,
					msg: username + ' enrolled Successfully',
				};
				return response;
			}
		} else {
			throw new Error('User was not enrolled ');
		}
	} catch (error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		return 'failed ' + error.toString();
	}

};

var registerUser = async function (username, userOrg, isJson) {
	try {
		var client = await getClientForOrg(userOrg);

		var user = await client.getUserContext(username + userOrg, true);

		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
		} else {
			var retObj = await loadUser(username, userOrg, client);
			if (retObj.status == false) {
				return retObj.msg;
			}
			user = retObj.data;
		}

		if (user && user.isEnrolled) {
			if (isJson && isJson === true) {
				var response = {
					status: true,
					secret: user._enrollmentSecret,
					msg: username + ' enrolled Successfully',
				};
				return response;
			}
		} else {
			throw new Error('User was not enrolled ');
		}
	} catch (error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		return 'failed ' + error.toString();
	}
};


var loadUser = async function (username, userOrg, client) {
	try {
		let configPathFile = hfc.getConfigSetting('network-connection-profile-path');
		var data = YAML.parse(fs.readFileSync(configPathFile).toString());
		var userObj = data.organizations[userOrg][username];

		var keyPath = path.join(path.resolve(__dirname, '..'), userObj.key);

		var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();

		var certPath = path.join(path.resolve(__dirname, '..'), userObj.cert);
		var certPEM = readAllFiles(certPath)[0].toString();

		await client.createUser({
			username: username + userOrg,
			mspid: client.getMspid(),
			cryptoContent: {
				privateKeyPEM: keyPEM,
				signedCertPEM: certPEM
			}
		});//back user json string
		var user = await client.getUserContext(username + userOrg, true);
		if (user && user.isEnrolled) {
			return { status: true, msg: username + ' enrolled Successfully', data: user };
		} else {
			return { status: false, msg: 'User was not enrolled ' };
		}
	} catch (error) {
		return { status: false, msg: 'registered user: ' + username + error.toString() };
	}
};

var setupChaincodeDeploy = function () {
	process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
};

var getLogger = function (moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.setLevel('DEBUG');
	return logger;
};

function readAllFiles(dir) {
	var files = fs.readdirSync(dir);
	var certs = [];
	files.forEach((file_name) => {
		let file_path = path.join(dir, file_name);
		let data = fs.readFileSync(file_path);
		certs.push(data);
	});
	return certs;
}

var signGasData = function (userOrg, data) {
	let configPathFile = hfc.getConfigSetting('network-connection-profile-path');
	var configYaml = YAML.parse(fs.readFileSync(configPathFile).toString());
	var userObj = configYaml.organizations[userOrg]["gasUser"];

	var keyPath = path.join(path.resolve(__dirname, '..'), userObj.key);
	var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();

	var cryptoSuite = hfc.newCryptoSuite();
	var privateKey = cryptoSuite.importKey(keyPEM, { algorithm: api.CryptoAlgorithms.X509Certificate, ephemeral: true });

	const sha256 = crypto.createHash('sha256');
	var digest = sha256.update(data).digest();
	//var signBuffer = cryptoSuite.sign(privateKey, Buffer.from(digest, 'hex'));
	//var result = cryptoSuite.verify(publicKey, signBuffer, Buffer.from(digest, 'hex'));
	var ec = new EC('secp256k1');
	var key = ec.keyFromPrivate(privateKey._key.prvKeyHex, 'hex');
	var signature = key.sign(digest);
	// Export DER encoded signature in Array
	var derSign = signature.toDER('hex');
	//var key = ec.keyFromPublic(key.getPublic().encode('hex'), 'hex');
	return derSign;
}

var getAllCertPubKeys = function () {
	let configPathFile = hfc.getConfigSetting('network-connection-profile-path');
	var configYaml = YAML.parse(fs.readFileSync(configPathFile).toString());
	var orgs = configYaml.organizations;
	var pubKeys = [];
	for (var k in orgs) {
		var user = orgs[k].gasUser;
		if (user) {
			var keyPath = path.join(path.resolve(__dirname, '..'), user.key);
			var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();

			var cryptoSuite = hfc.newCryptoSuite();
			var privateKey = cryptoSuite.importKey(keyPEM, { algorithm: api.CryptoAlgorithms.X509Certificate, ephemeral: true });

			var ec = new EC('secp256k1');
			var key = ec.keyFromPrivate(privateKey._key.prvKeyHex, 'hex');
			pubKeys.push({
				orgName: k,
				pubKey: key.getPublic().encode('hex')
			});
		}
	}
	return pubKeys;
}

//生成sm２国密公私钥
var generateGmKeyPair = function (userOrg, data) {
	var curve = 'SM2';
	var ec = new gm.KJUR.crypto.ECDSA({ "curve": curve });
	var keypair = ec.generateKeyPairHex();
	var privatekey = keypair.ecprvhex;
	var publickey = keypair.ecpubhex;

	return { pubKey: publickey, privateKey: privatekey };
}

//国密公钥加密
var encrypt = function (pubKeyHex, data) {
	var encryptData = gm.sm2Encrypt(data, pubKeyHex);
	return encryptData;
}
//国密私钥解密
var decrypt = function (privateKeyHex, encryptData) {
	return gm.sm2Decrypt(encryptData, privateKeyHex);;
}

/**
 * 是否是合约查询返回的错误
 * @param {*} msg 错误信息
 */
function isCCQueryError(msg) {
	if (msg.indexOf("Error:") >= 0) {
		var newMsg = msg.replace(/Error:\s+/, "");
		var reg = /E\d{6}/;
		if (reg.test(newMsg)) {
			return { status: true, errorCode: newMsg };
		}
	}
	return { status: false};
}

var parseMsg = function (details) {
	if (details.indexOf("chaincode error") >= 0 || details.indexOf("Error:") >= 0) { 
		var ret = isCCQueryError(details);
		if (ret.status==true) {
			return { status: false, errorCode: ret.errorCode,msg:'' };
		} else {
			var regex = "\\((.+?)\\)";
			var arr = details.match(regex);
			var message = details;
			if (arr.length > 1) {
				try {
					message = arr[1].substring(arr[1].indexOf("message:") + 8, arr[1].length).trim();
				} catch (e) { }
			}
			return { status: false, msg: message };
		}
	} else {
		var result = null;
		try {
			result = JSON.parse(details);
			//!("key" in obj);obj.hasOwnProperty("key")
			if (("status" in result)) {
				return result;
			}
		} catch (e) {
			result = details;
		}

		if (("" + result) == "true" || ("" + result) == "false") {
			if (("" + result) == "true") {
				return { status: true, msg: "" };
			} else if (("" + result) == "false") {
				return { status: false, msg: "" };
			}
		}

		return { status: true, data: result };
	}
};

var newEventHubs = async function (channelName, peerNames, orgName) {
	return await newRemotes2(channelName, peerNames, orgName);
};

async function newRemotes2(channelName, names, userOrg) {
	let client = await getClientForOrg(userOrg);
	var channel = client.getChannel(channelName);

	let targets = [];
	// find the peer that match the names
	for (let idx in names) {
		let peerName = names[idx];
		var channel_event_hub = channel.newChannelEventHub(peerName);
		targets.push(channel_event_hub);
	}

	if (targets.length === 0) {
		logger.error(util.format('Failed to find peers matching the names %s', names));
	}

	return targets;
}

async function newRemotes(channelName, names, userOrg) {
	let client = await getClientForOrg(userOrg);
	var channel = client.getChannel(channelName);

	let configPathFile = hfc.getConfigSetting('network-connection-profile-path');
	var yamlData = YAML.parse(fs.readFileSync(configPathFile).toString());

	let targets = [];
	// find the peer that match the names
	for (let idx in names) {
		let peerName = names[idx];
		// found a peer matching the name
		let data = fs.readFileSync(path.join(path.resolve(__dirname, '..'), yamlData.peers[peerName]['tlsCACerts']['path']));
		let grpcOpts = {
			pem: Buffer.from(data).toString(),
			'ssl-target-name-override': yamlData.peers[peerName]['grpcOptions']['ssl-target-name-override']
		};
		var peer = client.newPeer(yamlData.peers[peerName].url, grpcOpts);
		let channel_event_hub = channel.newChannelEventHub(peer);
		targets.push(channel_event_hub);
	}

	if (targets.length === 0) {
		logger.error(util.format('Failed to find peers matching the names %s', names));
	}

	return targets;
}

exports.getClientForOrg = getClientForOrg;
exports.getLogger = getLogger;
exports.setupChaincodeDeploy = setupChaincodeDeploy;
exports.getRegisteredUser = getRegisteredUser;
exports.registerUser = registerUser;
exports.signGasData = signGasData;
exports.getAllCertPubKeys = getAllCertPubKeys;
exports.generateGmKeyPair = generateGmKeyPair;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.parseMsg = parseMsg;
exports.newEventHubs = newEventHubs;