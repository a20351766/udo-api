$(document).ready(function () {
    /**
     * 下面是进行插件初始化
     * 你只需传入相应的键值对
     * */
    $('#myForm').bootstrapValidator({
        message: '输入值无效',
        feedbackIcons: {/*输入框不同状态，显示图片的样式*/
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {/*验证*/
            data: {
                message: '确认数据无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '确认数据不能为空'
                    },
                }
            }
        }
    });
});

function checkTime(obj) {
    if (obj.value != null && obj.value != "" && obj.value != undefined) {
        $("#myForm").data("bootstrapValidator").updateStatus("releaseTime", "NOT_VALIDATED", null).validateField("releaseTime");
    }
};

angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.confirm = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            if (!$scope.tokenID) {
                layer.alert('token标识不能为空！');
                return;
            }
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            //var hexStr = wallet.stringToHex($scope.data);
            $scope.origin = $scope.data;
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: { tokenID: $scope.tokenID,data: $scope.data},
                url: './v1/wallet/isMajorityConfirmed'
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
    }

    $scope.hideShowPwd = function(){
        var privateKeyInput = document.getElementById('privateKey');
        if (privateKeyInput.type == "password") {
            privateKeyInput.type = "text";
        } else {
            privateKeyInput.type = "password";
        }
        $(".input-group-addon").toggleClass("glyphicon-eye-close glyphicon-eye-open");
    } 
});