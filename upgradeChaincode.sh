#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

starttime=$(date +%s)

echo "POST Install chaincode on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.udo.com"],
	"chaincodeName":"mycc",
	"chaincodePath":"github.com/wallet",
	"chaincodeVersion":"v1",
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
  "peers": ["peer0.org2.udo.com"],
  "chaincodeName":"mycc",
  "chaincodePath":"github.com/wallet",
  "chaincodeVersion":"v1",
  "username":"admin",
  "orgname":"Org2"
}'
echo
echo

#echo "POST Install chaincode on Org2"
#echo
#curl -s -X POST \
#  http://localhost:4000/chaincodes \
#  -H "content-type: application/json" \
#  -d '{
#	"peers": ["peer1","peer2"],
#	"chaincodeName":"mycc",
#	"chaincodePath":"github.com/wallet1.0",
#	"chaincodeVersion":"v15",
#  "username":"admin",
#  "orgname":"org2"
#}'
#echo
#echo

echo "POST upgrade chaincode on peer1 of Org1"
echo
curl -s -X POST \
  http://localhost:4000/upgrade \
  -H "content-type: application/json" \
  -d '{
  "peers": ["peer0.org1.udo.com"],
	"chaincodeName":"mycc",
	"chaincodeVersion":"v1",
  "username":"user",
  "orgname":"Org1"
}'
#echo

echo
echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
