function isJson(text) {
    if (text == "true" || text == "false") {
        return false;
    }
    
    var isjson = typeof (text) == "object" && Object.prototype.toString.call(text).toLowerCase() == "[object object]" && !text.length;
    if (isjson)
        return true;

    //if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
    //    return true;
    //}
    if (typeof text == 'string') {
        try {
            var obj = JSON.parse(text);
            if (typeof obj == 'object' && obj) {
                return true;
            } else {
                return false;
            }

        } catch (e) {
            return false;
        }
    }

    return false;
};
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
                message: 'TOKEN数量无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '主币地址不能为空'
                    },
                }
            },
            privateKey: {
                message: '私钥无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '主币地址对应的私钥不能为空'
                    },
                }
            },
            gasAddress: {
                message: 'gas地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'gas地址不能为空'
                    },
                }
            },
            charge_gas: {
                message: 'gas无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'gas不能为空'
                    },
                    numeric: { message: 'gas只能为数字' },
                }
            },
            name: {
                message: '名称无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '名称不能为空'
                    },
                }
            },
            tokenSymbol: {
                message: 'TOKEN简写名称无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'TOKEN简写名称不能为空'
                    },
                }
            },
            decimalUnits: {
                message: '最大小数点位数无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '最大小数点位数不能为空'
                    },
                    stringLength: {/*长度提示*/
                        min: 1,
                        max: 2,
                        message: '位数必须在1到2之间'
                    },
                    numeric: { message: '最大小数点位数只能为数字' },
                }
            },
            totalNumber: {
                message: '发行总量无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '发行总量不能为空'
                    },
                    stringLength: {/*长度提示*/
                        min: 3,
                        max: 30,
                        message: '位数必须在５到30之间'
                    },
                    numeric: { message: '发行总量只能为数字' },
                }
            }, 
            issuePrice: {
                message: '发行价格无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '发行价格不能为空'
                    },
                    numeric: { message: '发行价格只能为数字' },
                }
            }
        }
    });
});

function GtZeroNumric(val) {
    if (!val) {
        return false;
    }
    var reg = /^0\.0*$/;
    if (val==""||reg.test(val)) {
        return false
    }
    reg = /(^[1-9]([0-9]+)?(\.[0-9]{1,})?$)|(^[0-9]\.[0-9]([0-9])*$)/;
    return reg.test(val);
};

function GeZeroInt(val) {
    if (!val) {
        return false;
    }
    var reg = /^\d+$/;
    return reg.test(val);
}

angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KwmhWAaQm9Jf5f39JoJptzUnR3cRDXiZTfC5Vx3ZhHxTzxUdFeUy";
        $scope.address = "U1NSEatCGBoWPYzEVb3zmYY1zsoD7FiZTvL";
        $scope.gasAddress = "U1MaVHck2hdLLc8y82a86faB3F7UQT4KZJE";
        $scope.charge_gas = "0.001"
        $scope.name = "Universal Coin";
        $scope.tokenSymbol = "UC";
        $scope.decimalUnits = 12;
        $scope.totalNumber = "1000000000";
        $scope.issuePrice = "0.01";
        $scope.additional = "附加说明，我发了一个token";
    }); 

    $scope.initBlock = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            if (!GeZeroInt($scope.decimalUnits)) {
                layer.alert('最大小数点位数必须是大于0的整数！');
                return;
            }
            if (!GeZeroInt($scope.totalNumber)) {
                layer.alert('发行数量必须是大于0的整数！');
                return;
            }
            if (!GtZeroNumric($scope.issuePrice)) {
                layer.alert('发行价必须为大于0的数字！');
                return;
            }
            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var origin = { 
                name: $scope.name, 
                tokenSymbol: $scope.tokenSymbol,
                decimalUnits: $scope.decimalUnits,
                totalNumber: $scope.totalNumber, 
                issuePrice: $scope.issuePrice, 
                additional: $scope.additional, 
                pubKey: pubKey,
                address: $scope.address,
                gasAddress: $scope.gasAddress,
                chargeGas: $scope.charge_gas
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
                url: './v1/wallet/init'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('创建创世区块成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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