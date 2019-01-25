angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.address = "U1AqAo5Efy1u3hJ1e2CmB1DNMQneG7c49V5";
        $scope.privateKey = "KxBbWzrkTaS7R6MYpD1T78cABMaMvvSxi2Ee22aoo6iuEjDEpwsg";
        $scope.sender = "U17WT2odHATZHfwA9Z1xQh1tJPWdjTwDfAM";
        $scope.newAddress = "U18CVuSQvQRRxWSqBcGHJpNqWEqDSApFfBs";
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
            layer.alert('master地址不合规范!');
            return;
        }

        valid = wallet.isValidAddress($scope.newAddress);
        if (!valid) {
            layer.alert('要添加的地址不合规范!');
            return;
        }

        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = { 
            funcName:"pldWalletTokenAddManager",
            address: $scope.address,
            tokenID: $scope.tokenID,
            newAddress: $scope.newAddress
        };
        
        var jsonStr = JSON.stringify(origin);
        var originHexStr = wallet.stringToHex(jsonStr);
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: $scope.sender, pubKey:pubKey, origin: originHexStr, signature: signaturestr};

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/pureland/pldWalletTokenAddManager'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('添加成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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