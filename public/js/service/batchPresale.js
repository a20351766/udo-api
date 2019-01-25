Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份 
        "d+": this.getDate(),                    //日 
        "h+": this.getHours(),                   //小时 
        "m+": this.getMinutes(),                 //分 
        "s+": this.getSeconds(),                 //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

function getCurrDateStr() {
    var currTime = new Date().format("yyyy-MM-dd hh:mm:ss");
    currTime = currTime.replace(/-/gi,"");
    currTime = currTime.replace(/:/gi,"");
    currTime = currTime.replace(" ", "");
    return currTime;
}

angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.$watch('$viewContentLoaded', function () {
        $scope.privateKey = "KzGQJsvayeZnUuPkdkvhuw1EX3WuZjACZC4QfLwFxXHxc3dvG6f5";
        $scope.sender = "U1DdBue4boVSd4Rxbw9tMZqeCCW6KuBp4d3";
        $scope.address = "U17TJQnX9ytdfMcLMLdHBpm3geBARf2Y4Vc";
        $scope.number = "10";

        $scope.address2 = "U13mK4HGj3HonJniJhsHcK8Fce4RFNXw9Ya";
        $scope.number2 = "20";
    }); 
    $scope.transfer = function () {
        if (!$scope.tokenID) {
            layer.alert('token标识不能为空！');
            return;
        }
        var layerIndex = layer.msg('正在处理，请耐心等待....', { icon: 16, shade: [0.6, '#393D49'], scrollbar: false, time: 20000 });
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);

        var item1 = {
            address: $scope.address,
            number: $scope.number + ""
        };
        var item2 = {
            address: $scope.address2,
            number: $scope.number2 + ""
        };
        var origin = {
            funcName: "batchPresale",
            tokenID: $scope.tokenID,
            data: [item1, item2]
        };

        var originHexStr = wallet.stringToHex(JSON.stringify(origin));
        $scope.origin = originHexStr;

        var signaturestr = wallet.generateSign(originHexStr, $scope.privateKey);
        var sendData = { address: $scope.sender, pubKey: pubKey, origin: originHexStr, signature: signaturestr};
       
        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: sendData,
            url: './v1/wallet/batchPresale'
        }).then(function successCallback(response) {
            layer.close(layerIndex);
            var data = response.data;
            $scope.result = JSON.stringify(data);
            if(data.status) {
                layer.msg('批量预售股权成功。' + data.txId, { icon: 6, shade: [0.6, '#393D49'], scrollbar: false, time: 3000 });
            } else {
                layer.alert(data.msg);
            }
        }, function errorCallback(response) {
            // 请求失败执行代码
            layer.close(layerIndex);
            layer.alert('服务端出错!');
        });
    }
});