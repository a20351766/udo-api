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
            address: {
                message: '普通管理者地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '普通管理者地址不能为空'
                    },
                }
            },
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
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.address = "1DdBue4boVSd4Rxbw9tMZqeCCW6KuBp4d3";
        var sendData = {
            funcName: "presaleVesting",
            address: "17TJQnX9ytdfMcLMLdHBpm3geBARf2Y4Vc",
            startTime: 1528373169,
            initReleaseAmount: "100",
            amount: "10000",
            interval: 10,
            periods: 240
        }
    }); 
    
    $scope.confirm = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            if (!$scope.tokenID) {
                layer.alert('token标识不能为空！');
                return;
            }
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            var sendData = { 
                tokenID: $scope.tokenID,
                address: $scope.address, 
                data: $scope.data
            };
            var jsonStr = JSON.stringify(sendData);
            $scope.origin = jsonStr;
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: sendData,
                url: './v1/wallet/isConfirmed'
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