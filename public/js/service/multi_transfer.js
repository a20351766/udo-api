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
                message: '付款方私钥无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '付款方私钥不能为空'
                    },
                }
            }
        }
    });
});
angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {

    $scope.transfer = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            if($scope.tokenID=="") {
                layer.alert('token标识不能为空!');
                return;
            }
            if ($scope.privateKey == "") {
                layer.alert('付款方私钥不能为空!');
                return;
            }
            if ($scope.busnID=="") {
                layer.alert('业务交易ID不能为空!');
                return;
            }
            if ($scope.nonce == "") {
                layer.alert('nonce不能为空!');
                return;
            }
            var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var receiveData = [];
            for(var i =1;i <=3;i++ ) {
                var addr = $("input[name='address" + i + "']").val();
                var num =   $("input[name='number" + i + "']").val();
                if (addr != "" && num!="") {
                    receiveData.push(
                        {
                            address: addr,
                            number: num
                        }
                    );
                }
            }
            var transfer = {
                pubKey: pubKey,//转账方公钥
                address: $scope.sender,//转账方地址
                tokenID: $scope.tokenID,
                receiveSides: receiveData
            };
            var origin = {
                busnID: $scope.busnID,
                nonce: $scope.nonce,
                transfer: transfer
            };
            var jsonStr = JSON.stringify(origin);
            $scope.origin = jsonStr;
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
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
                url: './v1/wallet/multiTransfer'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    var jsonStr = JSON.stringify(data);
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