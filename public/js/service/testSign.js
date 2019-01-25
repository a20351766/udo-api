angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
   
    $scope.transfer = function () {
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var signaturestr = wallet.generateSign($scope.data, $scope.privateKey);
        $scope.origin = signaturestr;
    }
});