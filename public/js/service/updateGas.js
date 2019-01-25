angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
   
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KzGQJsvayeZnUuPkdkvhuw1EX3WuZjACZC4QfLwFxXHxc3dvG6f5";
        $scope.address = "U1DdBue4boVSd4Rxbw9tMZqeCCW6KuBp4d3";
        $scope.charge_gas = "0.001";
    });
    $scope.transfer = function () {
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = {
            funcName: "updateChargeGas",
            chargeGas: $scope.charge_gas
        };
        var originHexStr = wallet.stringToHex(JSON.stringify(origin));
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: $scope.address, pubKey: pubKey,origin: originHexStr, signature: signaturestr };

        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/updateChargeGas'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if (data.status) {
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