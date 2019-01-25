angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.getAddress = function () {
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'GET',
            url: './v1/wallet/new'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            if(data.status) {
                $scope.isShow = true;
                $scope.address = data.address;
                $scope.privateKey = data.privateKey;
            } else {
                layer.alert(data.msg);
            }
        }, function errorCallback(response) {
            // 请求失败执行代码
            layer.close(layerIndex);
            layer.alert('服务端出错!');
        });
    }

    $scope.hideShowPwd = function () {
        var privateKeyInput = document.getElementById('privateKey');
        if (privateKeyInput.type == "password") {
            privateKeyInput.type = "text";
        } else {
            privateKeyInput.type = "password";
        }
        $(".input-group-addon").toggleClass("glyphicon-eye-close glyphicon-eye-open");
    }
});