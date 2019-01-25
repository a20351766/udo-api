angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "L2MqBDWt1xbshYBVont3Hub738sW11Rj8WShA96h2pHFH5hsnjr8";
        $scope.sender = "U1CzoX3Zv714K8B8q5cU126NfRMwGGpsC6D";
        $scope.oldAddress = "U19XEHtDzrPL4N6faXax5VqWTotTPoLhJ2o";
    }); 

    $scope.transfer = function () {
        if (!$scope.tokenID) {
            layer.alert('token标识不能为空！');
            return;
        }
        if (!$scope.privateKey) {
            layer.alert('私钥不能为空!');
            return;
        }
        var valid = wallet.isValidAddress($scope.sender);
        if (!valid) {
            layer.alert('超级管理员地址不合规范!');
            return;
        }

        valid = wallet.isValidAddress($scope.oldAddress);
        if (!valid) {
            layer.alert('旧地址不合规范!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = { 
            funcName: "removeManager",
            tokenID:$scope.tokenID,
            oldAddress: $scope.oldAddress
        };

        var originHexStr = wallet.stringToHex(JSON.stringify(origin));
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: $scope.sender,pubKey:pubKey,origin: originHexStr, signature: signaturestr};

        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/udo_removeManager'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('删除成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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