angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "";
        $scope.address = "U1CzoX3Zv714K8B8q5cU126NfRMwGGpsC6D";
        $scope.masterThreshold = 1;
        $scope.managerThreshold = 3;
        $scope.staffAddress1 = "U1DdBue4boVSd4Rxbw9tMZqeCCW6KuBp4d3";
        $scope.staffAddress2 = "U191b5F3z6epTJr6L7QG7durL6PqwaptiYq";
        $scope.staffAddress3 = "U129C4usFoaJ7GYh4fY1Xqa7iqMx1Zssz45";
    }); 

    $scope.transfer = function () {

        if (!$scope.privateKey) {
            layer.alert('私钥不能为空！');
            return;
        }

        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var sender = wallet.getAddressFromPrivateKey($scope.privateKey);

        if (!$scope.tokenID) {
            layer.alert('token标识不能为空！');
            return;
        }

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
            leaderAddress: $scope.address,
            masterThreshold: +$scope.masterThreshold,
            managerThreshold: +$scope.managerThreshold,
            staffAddresses: managers
        };

        var jsonStr = JSON.stringify(origin);
        var originHexStr = wallet.stringToHex(jsonStr);

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: sender, pubKey: pubKey, origin: originHexStr, signature: signaturestr};
        
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/udo_provideAuthority'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            if(data.status) {
                console.log(data);
                layer.msg('设置用户权限及角色成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 5000 });
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