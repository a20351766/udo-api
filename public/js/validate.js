//假定字符串的每节数都在5位以下
function toNum(a) {
    var a = a.toString();
    //也可以这样写 var c=a.split(/\./);
    var c = a.split('.');
    var num_place = ["", "0", "00", "000", "0000"], r = num_place.reverse();
    for (var i = 0; i < c.length; i++) {
        var len = c[i].length;
        c[i] = r[len] + c[i];
    }
    var res = c.join('');
    return res;
}
function cmp_version(a, b) {
    var _a = toNum(a), _b = toNum(b);
    if (_a == _b) return 0;
    if (_a > _b) return 1;
    if (_a < _b) return -1;
}
function  validateVersion(version) {
    if (!version)
        return false;
    var reg = /(^\d+\.\d+\.\d+$)|(^\d+$)|(^\d+\.\d+$)/;
    return reg.test(version);
}

