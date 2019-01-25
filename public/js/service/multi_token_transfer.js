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
            }
        }
    });
});
angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KwmhWAaQm9Jf5f39JoJptzUnR3cRDXiZTfC5Vx3ZhHxTzxUdFeUy";
    }); 
    
    $scope.transfer1 = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            
            var tokenItems = [];
            for (var i = 1; i <= 2; i++) {
                var tokenID = $("input[name='tokenID" + i + "']").val();
                var receiveSides = [];
                for (var j = 1; j <= 3; j++) {
                    var addr = $("input[name='toAddress" + i + "" + j + "']").val();
                    var number = $("input[name='number" + i + "" + j + "']").val();
                    receiveSides.push({
                        address: addr,
                        number: number
                    });
                }
                tokenItems.push({
                    tokenID: tokenID,
                    receiveSides: receiveSides
                })
            }
            var transferItems = [];
            for (var i = 1; i <= 2; i++) {
                var privateKey = $("input[name='privateKey" + i + "']").val();
                var address = $("input[name='address" + i + "']").val();
                var pubKey = wallet.getPubKeyFromPrivateKey(privateKey);
                transferItems.push({
                    pubKey: pubKey,
                    address: address,
                    tokenItems: tokenItems
                });
            }
            var origin = { 
                busnID: "1", 
                nonce:"1",
                transferItems: transferItems
            };
            var jsonStr = JSON.stringify(origin);
            $scope.origin = jsonStr;

            var signData = {};
            for (var i = 0; i < origin.transferItems.length;i++) {
                var item = origin.transferItems;
                var signaturestr = wallet.generateSign(jsonStr, $scope.privateKey+(i+1));
                signData[item.address] = signaturestr;
            }
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            var sendData = { origin: origin, signData: signData };
            jsonStr = JSON.stringify(sendData);
            var hexStr = wallet.stringToHex(jsonStr);
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: { rawData: hexStr },
                url: './v1/wallet/multiTokenTransfer'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('多地址转账成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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