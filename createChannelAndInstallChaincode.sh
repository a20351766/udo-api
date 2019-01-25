#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

starttime=$(date +%s)

echo "POST request Create channel  ..."
echo
curl -s -X POST \
  http://localhost:4000/channels \
  -H "content-type: application/json" \
  -d '{
	"channelName":"timechannel",
	"channelConfigPath":"../artifacts/channel/channel-artifacts/timechannel.tx",
  "username":"admin",
  "orgname":"Org1"
}'
echo
echo
sleep 5
echo "POST request Join channel on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/timechannel/peers \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.udo.com","peer1.org1.udo.com"],
  "username":"admin",
  "orgname":"Org1"
}'
echo
echo

echo "POST request Join channel on Org2"
echo
curl -s -X POST \
  http://localhost:4000/channels/timechannel/peers \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.udo.com","peer1.org2.udo.com"],
  "username":"admin",
  "orgname":"Org2"
}'
echo
echo

echo "POST Install chaincode on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.udo.com", "peer1.org1.udo.com"],
	"chaincodeName":"mycc",
	"chaincodePath":"github.com/wallet",
	"chaincodeVersion":"v0",
  "username":"admin",
  "orgname":"Org1"
}'
echo
echo


echo "POST Install chaincode on Org2"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.udo.com","peer1.org2.udo.com"],
	"chaincodeName":"mycc",
	"chaincodePath":"github.com/wallet",
	"chaincodeVersion":"v0",
  "username":"admin",
  "orgname":"Org2"
}'
echo
echo

#echo "POST instantiate chaincode on peer1 of Org1"
#echo
#curl -s -X POST \
#  http://localhost:4000/channels/timechannel/chaincodes \
#  -H "content-type: application/json" \
#  -d '{
#	"chaincodeName":"mycc",
#	"chaincodeVersion":"v0"
#}'
#echo
#echo

echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
