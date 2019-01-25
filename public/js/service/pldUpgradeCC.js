var ccData = "";
$('input[type=file]').on('change', function () {
    var reader = new FileReader();
    reader.onload = function (e) {
        ccData = reader.result;//或者 e.target.result都是一样的，都是base64码
    }
    reader.readAsDataURL(this.files[0])
    //filses就是input[type=file]文件列表，files[0]就是第一个文件，这里就是将选择的第一个文件转化为base64的码
});

angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        var obj = {
            action:"upgrade",
            a: "a",
            b: "b",
            aval: "100",
            bval: "200"
        };
        $scope.argsJson = JSON.stringify(obj);
    });
    
    $scope.apply = function () {
        if (!$scope.privateKey) {
            layer.alert('合约关联的钱包私钥不能为空!');
            return;
        }
        if (!$scope.address) {
            layer.alert('合约地址不能为空!');
            return;
        }
        if ($scope.version == "") {
            layer.alert('合约版本不能为空!');
            return;
        }
        if (!validateVersion($scope.version)) {
            layer.alert('合约版本格式不正确!');
            return;
        }
        if ($scope.argsJson == "") {
            layer.alert('合约实例化参数不能为空!');
            return;
        }

        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);//合约关联的钱包
        var origin = {
            contractAddress: $scope.address,
            version: $scope.version,
            args: $scope.argsJson
        };
        var jsonStr = JSON.stringify(origin);
        var originHexStr = wallet.stringToHex(jsonStr);
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { pubKey: pubKey, origin: originHexStr, signature: signaturestr,ccData:ccData};
        jsonStr = JSON.stringify(sendData);
        var hexStr = wallet.stringToHex(jsonStr);

        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 50000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { rawData: hexStr },
            url: './v1/pureland/pldUpgradeCC'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if (data.status) {
                layer.msg('升级成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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