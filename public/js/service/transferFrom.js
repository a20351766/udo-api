angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "L1UCHbRzBMZjrvCYjZksXsczg4Z4Csse2R7wSgaKAU6EgTjavqgD";
        $scope.sender = "19braQ9bXFKqjrUq1KTsPp6uerh7FkmMaV";
        $scope.fromAddress = "19XEHtDzrPL4N6faXax5VqWTotTPoLhJ2o";
        $scope.toAddress = "1MaVHck2hdLLc8y82a86faB3F7UQT4KZJE";
        $scope.number = "30";
    }); 
    $scope.transfer = function () {
        if (!$scope.tokenID) {
            layer.alert('token标识或ID不能为空!');
            return;
        }
        var valid = wallet.isValidAddress($scope.sender);
        if (!valid) {
            layer.alert('委托方钱包地址不合规范!');
            return;
        }

        valid = wallet.isValidAddress($scope.fromAddress);
        if (!valid) {
            layer.alert('付款方钱包地址不合规范!');
            return;
        }

        valid = wallet.isValidAddress($scope.toAddress);
        if (!valid) {
            layer.alert('收款方钱包地址不合规范!');
            return;
        }

        if ($scope.number == "" || $scope.number=="0") {
            layer.alert('转出的数量不能为空!');
            return;
        }

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var origin = { 
            tokenID: $scope.tokenID,
            sender: $scope.sender, 
            fromAddress: $scope.fromAddress, 
            toAddress: $scope.toAddress, 
            number: $scope.number,
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
            url: './v1/wallet/transferFrom'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('转账成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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