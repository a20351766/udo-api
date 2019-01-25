angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {

    $scope.transfer = function () {

        if (!$scope.privateKey) {
            layer.alert('私钥不能为空!');
            return;
        }
        var valid = wallet.isValidAddress($scope.address);
        if (!valid) {
            layer.alert('地址不合规范!');
            return;
        }
       var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
       var newAddress = wallet.getAddressFromPrivateKey($scope.privateKey);
        $scope.newAddress = newAddress;
        $scope.pubKey = pubKey;

        var origin = {
            pubKey: pubKey,
            data:"123456"
        }
        //var signaturestr = wallet.generateSign(origin.data, $scope.privateKey);
        //$scope.signture = signaturestr;
        var sendData = { origin: origin, signature: $scope.signture };
        jsonStr = JSON.stringify(sendData);
        var hexStr = wallet.stringToHex(jsonStr);
         $http({
            method: 'POST',
            data: { rawData: hexStr },
            url: './v1/wallet/test'
        }).then(function successCallback(response) {
            var data = response.data;
            $scope.result = JSON.stringify(data);
        }, function errorCallback(response) {
        });
    }
});