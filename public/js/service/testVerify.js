angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
   
    $scope.transfer = function () {
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var data = $scope.data;
        var signature = $scope.signature;

        $http({
            headers: {
                Accept: "application/json; charset=utf-8",
                language: $scope.lang
            },
            method: 'POST',
            data: { pubKey: pubKey, origin: data, signature: signature},
            url: './v1/wallet/test'
        }).then(function successCallback(response) {
            var data = response.data;
            $scope.result = JSON.stringify(data);
        }, function errorCallback(response) {
            layer.alert('服务端出错!');
        });
    }
});