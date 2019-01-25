angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.currentTime = "1000";
        $scope.startTime = "100";
        $scope.initReleaseAmount = "100";
        $scope.amount = "10000";
        $scope.interval = "10";
        $scope.periods = "240";
    }); 
    
    $scope.query = function () {
        var flag = true;
        if (flag) {
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            //var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var origin = { 
                currentTime: +$scope.currentTime,
                startTime: +$scope.startTime, 
                initReleaseAmount: $scope.initReleaseAmount,
                amount: $scope.amount, 
                interval: +$scope.interval, 
                periods: +$scope.periods
            };
            var jsonStr = JSON.stringify(origin);
            $scope.origin = jsonStr;
            //var signaturestr = wallet.generateSign(jsonStr, $scope.privateKey);
            //var sendData = { origin: origin, signature: signaturestr };
            //jsonStr = JSON.stringify(sendData);
            //var hexStr = wallet.stringToHex(jsonStr);
            $http({
                method: 'POST',
                data: origin,
                url: './v1/wallet/vestingFunc'
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
    };

    $scope.hideShowPwd = function(){
        var privateKeyInput = document.getElementById('privateKey');
        if (privateKeyInput.type == "password") {
            privateKeyInput.type = "text";
        } else {
            privateKeyInput.type = "password";
        }
        $(".input-group-addon").toggleClass("glyphicon-eye-close glyphicon-eye-open");
    };
});