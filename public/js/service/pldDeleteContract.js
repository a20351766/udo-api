angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) { 

    $scope.del = function () {
        if (!$scope.privateKey) {
            layer.alert('合约关联的钱包私钥不能为空!');
            return;
        }
        if (!$scope.address) {
            layer.alert('合约地址不能为空!');
            return;
        }

        if (!validateVersion($scope.version)) {
            layer.alert('合约版本格式不正确!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 50000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);//合约帐户
        var origin = { 
            contractAddress: $scope.address,
            version: $scope.version
        };
        var jsonStr = JSON.stringify(origin);
        var originHexStr = wallet.stringToHex(jsonStr);
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { pubKey:pubKey, origin: originHexStr, signature: signaturestr};
        jsonStr = JSON.stringify(sendData);
        var hexStr = wallet.stringToHex(jsonStr);
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { rawData: hexStr},
            url: './v1/pureland/pldDeleteContract'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('删除成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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