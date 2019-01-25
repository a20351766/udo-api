angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.transfer = function () {
       
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var address = wallet.getAddressFromPrivateKey($scope.privateKey);
        var origin = {
            address: address, 
            pubKey: pubKey
        };
        var jsonStr = JSON.stringify(origin);
        $scope.origin = jsonStr;
        var signaturestr = wallet.generateSign(jsonStr, $scope.privateKey);
        var sendData = { address: address, pubKey: pubKey, originData: jsonStr, signature: signaturestr};
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/queryVestingInfo'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
        }, function errorCallback(response) {
            // 请求失败执行代码
            layer.close(layerIndex);
            layer.alert('服务端出错!');
        });
    }
});