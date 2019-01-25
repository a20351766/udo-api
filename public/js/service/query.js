angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.query = function () {
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'GET',
            data: { fcn: $scope.fcn, args: [$scope.args], peer: $scope.peer },
            url: './v1/wallet/queryBalance/' + $scope.args   
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            console.log(response.data)
        }, function errorCallback(response) {
            // 请求失败执行代码
            layer.close(layerIndex);
            layer.alert('服务端出错!');
        });
    }
});