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
	"peers": ["peer1", "peer2"],
	"chaincodeName":"mycc",
	"chaincodePath":"github.com/wallet",
	"chaincodeVersion":"v0",
  "username":"admin",
  "orgname":"org1"
}'
echo
echo


echo "POST Install chaincode on Org2"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer1","peer2"],
	"chaincodeName":"mycc",
	"chaincodePath":"github.com/wallet",
	"chaincodeVersion":"v0",
  "username":"admin",
  "orgname":"org2"
}'
echo
echo

echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
