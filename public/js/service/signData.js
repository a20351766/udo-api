angular.module('walletApp', []).controller('walletCtrl', function ($scope, $http) {
    $scope.transfer = function () {
       
        var pubKey = wallet.getPubKeyFromPrivateKey($scope.privateKey);
        var address = wallet.getAddressFromPrivateKey($scope.privateKey);

        var originStr = $scope.originData;
        var signaturestr = wallet.generateSign(originStr, $scope.privateKey);

        $scope.result = "address=" + address + "\npubKey=" + pubKey + "\nsignData=" + signaturestr;
    }
});