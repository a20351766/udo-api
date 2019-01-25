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
                message: '地址私钥无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '地址私钥不能为空'
                    },
                }
            },
            address: {
                message: '钱包地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '钱包地址不能为空'
                    },
                }
            }
        }
    });
});

angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.lock = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            if (!$scope.privateKey) {
                layer.alert("私钥不能为空！");
                return;
            }
            if (!$scope.address) {
                layer.alert("钱包地址不能为空！");
                return;
            }
            var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var sender = wallet.getAddressFromPrivateKey($scope.privateKey);
            var origin = { 
                funcName: "lockWallet",
                address: $scope.address,
                password: $scope.password
            };
            var originHexStr = wallet.stringToHex(JSON.stringify(origin));
            $scope.origin = originHexStr;

            var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
            var sendData = { address: sender, pubKey: pubKey,origin: originHexStr, signature: signaturestr };

            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: sendData,
                url: './v1/wallet/lockWallet'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('锁定成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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