angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
   
    $scope.transfer = function () {

        if (!$scope.privateKey) {
            layer.alert('合约关联的钱包地址私钥不能为空!');
            return;
        }

        if (!$scope.contractAddress) {
            layer.alert('合约地址不能为空!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
       
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var address = wallet.getAddressFromPrivateKey($scope.privateKey);
        var sendData = { 
            address: address,
            pubKey: pubKey,
            contractAddress: $scope.contractAddress,
            signature: wallet.generateSign($scope.contractAddress, $scope.privateKey)
        };
        $scope.origin = JSON.stringify(sendData);
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/udo_cc_disable'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('禁用成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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