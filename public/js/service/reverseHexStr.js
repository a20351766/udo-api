angular.module('wallletApp', []).controller('walletCtrl', function ($scope, $http, $timeout) {
    
    $scope.trans = function () {
        if($scope.origin=="") {
            layer.alert("16进制字符不能为空!");
            return;
        }
        $scope.result = wallet.hexToStringWide($scope.origin);
    };
});