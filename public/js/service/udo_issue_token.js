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
                message: '钱包地址无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '钱包地址不能为空'
                    },
                }
            },
            name: {
                message: 'TOKEN名称无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: 'TOKEN名称不能为空'
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
            enableNumber: {
                message: '可用数量无效',
                validators: {
                    notEmpty: {/*非空提示*/
                        message: '可用数量不能为空'
                    },
                    numeric: { message: '可用数量只能为数字' },
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
angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KymdUtTYKxPZZiTocUc1Dg2fLS4to7thAE6BjPpsWf6Qc5vgWbij";
        $scope.address = "U17TJQnX9ytdfMcLMLdHBpm3geBARf2Y4Vc";
        $scope.name = "Mobile Bank Token";
        $scope.tokenSymbol = "MBT";
        $scope.decimalUnits = 6;
        $scope.totalNumber = "10000";
        $scope.enableNumber = "5000";
        $scope.issuePrice = "0.01";
    }); 
    
    $scope.deployeeToken = function () {
        $("#myForm").data("bootstrapValidator").validate();
        var flag = $("#myForm").data("bootstrapValidator").isValid();
        if (flag) {
            var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
            var origin = { 
                name: $scope.name, 
                tokenSymbol:$scope.tokenSymbol,
                decimalUnits:$scope.decimalUnits,
                totalNumber: $scope.totalNumber, 
                enableNumber: $scope.enableNumber, 
                issuePrice: $scope.issuePrice
            };
            var jsonStr = JSON.stringify(origin);
            var originHexStr = wallet.stringToHex(jsonStr);
            $scope.origin = originHexStr;

            var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
            var sendData = { 
                address: $scope.address,
                pubKey: pubKey,
                origin: originHexStr, 
                signature: signaturestr 
            };
            jsonStr = JSON.stringify(sendData);
            var hexStr = wallet.stringToHex(jsonStr);

            var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 200000 });
            $http({
                headers: {
                    Accept: "application/json; charset=utf-8",
                    language: $scope.lang
                },
                method: 'POST',
                data: { rawData: hexStr },
                url: './v1/wallet/udo_issueToken'
            }).then(function successCallback(response) {
                layer.close(layerIndex);
                var data = response.data;
                $scope.result = JSON.stringify(data);
                if (data.status) {
                    layer.msg('发行TOKEN成功。', { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
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