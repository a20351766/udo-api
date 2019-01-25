angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.transfer = function () {
        if (!$scope.tokenID) {
            layer.alert('token标识或地址不能为空!');
            return;
        }
        var valid = wallet.isValidAddress($scope.sender);
        if (!valid) {
            layer.alert('授权方钱包地址不合规范!');
            return;
        }

        valid = wallet.isValidAddress($scope.agentAddress);
        if (!valid) {
            layer.alert('委托方钱包地址不合规范!');
            return;
        }

        if ($scope.number == "" || $scope.number=="0") {
            layer.alert('可转出的数量不能为空!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = {
            funcName: "pldApprove",
            tokenID: $scope.tokenID, 
            address: $scope.sender, 
            agentAddress: $scope.agentAddress,
            number: $scope.number,
        };

        var originHexStr = wallet.stringToHex(JSON.stringify(origin));
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: $scope.sender, pubKey: pubKey, origin: originHexStr, signature: signaturestr};
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/pureland/pldApprove'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('授权成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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