angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) { 

    $scope.$watch('$viewContentLoaded', function () {
        var origin = {
            a: "a",
            b: "b",
            aval: "100",
            bval: "200"
        };
        $scope.argsJson = JSON.stringify(origin);
    });

    $scope.apply = function () {
        if (!$scope.privateKey) {
            layer.alert('钱包私钥不能为空!');
            return;
        }
        if (!$scope.address) {
            layer.alert('合约地址不能为空!');
            return;
        }

        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);//平台币地址
        var origin = {
            contractAddress: $scope.address,
            args: $scope.argsJson
        };
        var jsonStr = JSON.stringify(origin);
        var originHexStr = wallet.stringToHex(jsonStr);
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { pubKey: pubKey, origin: originHexStr, signature: signaturestr };
        jsonStr = JSON.stringify(sendData);
        var hexStr = wallet.stringToHex(jsonStr);
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 50000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { rawData: hexStr},
            url: './v1/wallet/udo_cc_init'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('实例化成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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