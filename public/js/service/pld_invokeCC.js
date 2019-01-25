angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {

    $scope.transfer = function () {
        if(!$scope.contractAddress) {
            layer.alert('合约地址不能为空!');
            return;
        }
        if (!$scope.fcn) {
            layer.alert('合约方法名不能为空!');
            return;
        }
        if (!$scope.args) {
            layer.alert('合约方法执行所需的参数不能为空!');
            return;
        }
        if (!$scope.privateKey) {
            layer.alert('合约关联的钱包地址不能为空!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var address = wallet.getAddressFromPrivateKey($scope.privateKey);
        var origin = {
            fcn:$scope.fcn,
            args:$scope.args,
            sender: address,
            pubKey: pubKey
        };
        var jsonStr = JSON.stringify(origin);
        $scope.origin = jsonStr;

        var signaturestr = wallet.generateSign(jsonStr, $scope.privateKey);
        var sendData = { 
            fcn: $scope.fcn, 
            args: $scope.args,
            sender: address,
            pubKey: pubKey,
            originData: jsonStr,
            signature: signaturestr
        };
        
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/pureland/pldChaincodeInvoke/' + $scope.contractAddress
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('调用成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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