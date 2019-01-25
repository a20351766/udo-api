angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) { 

    $scope.apply = function () {
        if (!$scope.privateKey) {
            layer.alert('私钥不能为空!');
            return;
        }
        if (!$scope.address) {
            layer.alert('地址不能为空!');
            return;
        }
        if ($scope.id == "") {
            layer.alert('链编号不能为空!');
            return;
        }
        var valid = wallet.isValidAddress($scope.address);
        if (!valid) {
            layer.alert('地址不合规范!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = { 
            id: $scope.id,
            address: $scope.address,
            pubKey: pubKey
        };
        var jsonStr = JSON.stringify(origin);
        $scope.origin = jsonStr;
        var signaturestr = wallet.generateSign(jsonStr, $scope.privateKey);
        var sendData = { origin: origin, signature: signaturestr};
        jsonStr = JSON.stringify(sendData);
        var hexStr = wallet.stringToHex(jsonStr);
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { rawData: hexStr},
            url: './v1/wallet/udo_chainEnterCommit'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('提交成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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