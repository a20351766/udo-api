angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KzGQJsvayeZnUuPkdkvhuw1EX3WuZjACZC4QfLwFxXHxc3dvG6f5";
        $scope.sender = "U1DdBue4boVSd4Rxbw9tMZqeCCW6KuBp4d3";
        $scope.address = "U17TJQnX9ytdfMcLMLdHBpm3geBARf2Y4Vc";
        $scope.startTime = parseInt((new Date()).getTime() / 1000)+3600;
        $scope.initReleaseAmount = "100";
        $scope.amount = "1000";
        $scope.interval = "10";
        $scope.periods = "240";

        $scope.address2 = "U13mK4HGj3HonJniJhsHcK8Fce4RFNXw9Ya";
        $scope.startTime2 = parseInt((new Date()).getTime() / 1000) + 3600;
        $scope.initReleaseAmount2 = "100";
        $scope.amount2 = "900";
        $scope.interval2 = "1000";
        $scope.periods2 = "120";
    }); 
    $scope.transfer = function () {
        if (!$scope.tokenID) {
            layer.alert('token标识不能为空！');
            return;
        }
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
       
        var item1 = {
            address: $scope.address,
            startTime: +$scope.startTime,
            initReleaseAmount: $scope.initReleaseAmount,
            amount: $scope.amount,
            interval: +$scope.interval,
            periods: +$scope.periods
        };

        var item2 = {
            address: $scope.address2,
            startTime: +$scope.startTime2,
            initReleaseAmount: $scope.initReleaseAmount2,
            amount: $scope.amount2,
            interval: +$scope.interval2,
            periods: +$scope.periods2
        };
        var origin = {
            funcName: "batchPresaleVesting",
            tokenID: $scope.tokenID,
            data: [item1, item2]
        };
        var originHexStr = wallet.stringToHex(JSON.stringify(origin));
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = {
            address: $scope.sender,
            pubKey: pubKey,
            origin: originHexStr,
            signature: signaturestr
        };

        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/batchPresaleVesting'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('批量预售股权成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
            } else {
                layer.alert(data.msg);
            }
        }, function errorCallback(response) {
            // 请求失败执行代码
            layer.close(layerIndex);
            layer.alert('服务端出错!');
        });
    }
});