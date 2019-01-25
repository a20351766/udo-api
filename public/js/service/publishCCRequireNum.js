angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) { 

    $scope.transfer = function () {
        if (!$scope.privateKey) {
            layer.alert('私钥不能为空!');
            return;
        }
        if (!$scope.address) {
            layer.alert('地址不能为空!');
            return;
        }
        if ($scope.number == "" || $scope.number == "0") {
            layer.alert('平台币数量不能为空!');
            return;
        }
        var valid = wallet.isValidAddress($scope.address);
        if (!valid) {
            layer.alert('地址不合规范!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        //var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = { 
            funcName: "publishCCRequireNum",
            number: $scope.number+""
        };

        var originHexStr = wallet.stringToHex(JSON.stringify(origin));
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: $scope.address,origin: originHexStr, signature: signaturestr};

        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/udo_publishCCRequireNum'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('设置成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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