#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

starttime=$(date +%s)

echo "POST request Join channel on Org3"
echo
curl -s -X POST \
  http://localhost:4000/channels/timechannel/peers \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org3.udo.com"],
  "username":"admin",
  "orgname":"Org3"
}'
echo
echo

echo "POST Install chaincode on Org3"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org3.udo.com"],
	"chaincodeName":"mycc",
	"chaincodePath":"github.com/wallet",
	"chaincodeVersion":"v0",
  "username":"admin",
  "orgname":"Org3"
}'
echo
echo

echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
