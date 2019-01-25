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
                message: '管理者地址私钥无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '地址私钥不能为空'
                    },
                }
            },
            address: {
                message: '管理者地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '管理者地址不能为空'
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

function transdate(endTime) {
    var date = new Date();
    date.setFullYear(endTime.substring(0, 4));
    date.setMonth(endTime.substring(5, 7) - 1);
    date.setDate(endTime.substring(8, 10));
    date.setHours(endTime.substring(11, 13));
    date.setMinutes(endTime.substring(14, 16));
    date.setSeconds(endTime.substring(17, 19));
    return Date.parse(date) / 1000;
}

angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "L43uidrMsGCrorBeFg3L9eKyYenWpZtqgjnMxVaCGbpWFjSsaPXi";
    }); 
    
    $scope.confirm = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
           
            var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var address = wallet.getAddressFromPrivateKey($scope.privateKey);
            var originHexStr = $scope.data;//16进制数据

            $scope.origin = originHexStr;

            var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
            var sendData = { address: address, pubKey: pubKey, origin: originHexStr, signature: signaturestr };

            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: sendData,
                url: './v1/pureland/pldWalletTokenRevoke'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('撤销成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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