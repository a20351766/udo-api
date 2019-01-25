angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) { 

    $scope.apply = function () {
        if ($scope.name == "") {
            layer.alert('链名称不能为空!');
            return;
        }

        if ($scope.en_short == "") {
            layer.alert('链英文简写名称不能为空!');
            return;
        }

        if ($scope.remark == "") {
            layer.alert('链简介不能为空!');
            return;
        }

        if ($scope.contact_name == "") {
            layer.alert('联系人姓名不能为空!');
            return;
        }

        if ($scope.contact_tel == "") {
            layer.alert('联系人电话不能为空!');
            return;
        }

        var origin = { 
            name: $scope.name,
            en_short: $scope.en_short,
            remark: $scope.remark,
            contact_name: $scope.contact_name,
            contact_tel: $scope.contact_tel,
            e_mail: $scope.e_mail
        };
        var jsonStr = JSON.stringify(origin);
        var hexStr = wallet.stringToHex(jsonStr);
        $scope.origin = hexStr;
        
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { rawData: hexStr},
            url: './v1/wallet/udo_chainEnter'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('申请成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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