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
            privateKey: {
                message: 'token发行方或平台manager私钥无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'token发行方或平台manager私钥不能为空'
                    },
                }
            },
            address: {
                message: 'token发行方或平台manager地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'token发行方或平台manager地址不能为空'
                    },
                }
            },
            tokenID: {
                message: 'token标识或ID无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'token标识或ID不能为空'
                    },
                }
            },
            status: {
                message: 'token状态无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '请选择token状态'
                    },
                }
            }
        }
    });
});
angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KwmhWAaQm9Jf5f39JoJptzUnR3cRDXiZTfC5Vx3ZhHxTzxUdFeUy";
        $scope.address = "U1NSEatCGBoWPYzEVb3zmYY1zsoD7FiZTvL";
    }); 
    
    $scope.updateToken = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var origin = { 
                funcName: "updateTokenStatus",
                tokenID: $scope.tokenID,
                status: +$scope.status
            };

            var originHexStr = wallet.stringToHex(JSON.stringify(origin));
            $scope.origin = originHexStr;

            var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
            var sendData = { address: $scope.address, pubKey: pubKey,origin: originHexStr, signature: signaturestr };

            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: sendData,
                url: './v1/wallet/updateTokenStatus'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('设置token状态成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
                } else {
                    layer.alert(data.msg);
                }
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