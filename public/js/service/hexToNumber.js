angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.trans = function () {
        if($scope.hexStr=="") {
            layer.alert("16进制字符不能为空!");
            return;
        }
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { hexStr: $scope.hexStr },
            url: './v1/wallet/hexToNumber'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            if(data.status==true) {
                $scope.number = data.data;
            } else {
                layer.alert(data.msg);
            }
        }, function errorCallback(response) {
            // 请求失败执行代码
            layer.close(layerIndex);
            layer.alert('服务端出错!');
        });
    };
});