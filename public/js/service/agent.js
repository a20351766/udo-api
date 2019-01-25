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
                message: '合约地址私钥无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '合约地址私钥不能为空'
                    },
                }
            },
            address: {
                message: 'TOKEN地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'TOKEN地址不能为空'
                    },
                }
            },
            agentBusnId: {
                message: '经纪人业务ID无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '经纪人业务ID不能为空'
                    },
                }
            },
            agentType: {
                message: '经纪人类型无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '经纪人类型不能为空'
                    },
                }
            }
        }
    });
});
angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KwmhWAaQm9Jf5f39JoJptzUnR3cRDXiZTfC5Vx3ZhHxTzxUdFeUy";
        $scope.agentBusnId = "ABH002";
        $scope.agentType = "电影"
    }); 
    
    $scope.initBlock = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            var origin = { 
                agentBusnId: $scope.agentBusnId, 
                agentType: $scope.agentType, 
                tokenAddr: $scope.address
            };
            var jsonStr = JSON.stringify(origin);
            $scope.origin = jsonStr;
            var signaturestr = wallet.generateSign(jsonStr, $scope.privateKey);
            var sendData = { origin: origin, signature: signaturestr };
            jsonStr = JSON.stringify(sendData);
            var hexStr = wallet.stringToHex(jsonStr);
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: { rawData: hexStr },
                url: './v1/wallet/changeAgent'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('变更经纪人成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
                } else {
                    layer.alert(data.msg);
                }
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