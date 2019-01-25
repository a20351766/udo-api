angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "";
        $scope.address = "U1AqAo5Efy1u3hJ1e2CmB1DNMQneG7c49V5";
        $scope.managerThreshold = 3;
        $scope.staffAddress1 = "U1BFtK3uoeSajpMaa3SkdtRWabN326DST1p";
        $scope.staffAddress2 = "U17WT2odHATZHfwA9Z1xQh1tJPWdjTwDfAM";
        $scope.staffAddress3 = "U14gUqZJYitSvcp2dnzTSecnNXE6r4Dy5o7";
    });

    $scope.transfer = function () {
        if (!$scope.privateKey) {
            layer.alert('私钥不能为空！');
            return;
        }

        if (!$scope.address) {
            layer.alert('地址不能为空！');
            return;
        }

        if (!$scope.tokenID) {
            layer.alert('token标识不能为空！');
            return;
        }

        var valid = wallet.isValidAddress($scope.address);
        if (!valid) {
            layer.alert('地址不合规范!');
            return;
        }

        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        
        var managers = [];
        for (var i = 1; i <= 4; i++) {
            var addr = $("input[name='staffAddress" + i + "']").val();
            if (addr != "") {
                managers.push(addr);
            }
        }

        var origin = {
            tokenID: $scope.tokenID,
            managerThreshold: +$scope.managerThreshold,
            managerAddresses: managers
        };

        var jsonStr = JSON.stringify(origin);
        var originHexStr = wallet.stringToHex(jsonStr);
        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = {address: $scope.address, pubKey: pubKey, origin: originHexStr, signature: signaturestr};
        
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/pureland/pldWalletTokenProvideAuthority'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            if(data.status) {
                console.log(data);
                layer.msg('设置钱包地址下token的转账权限成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 5000 });
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