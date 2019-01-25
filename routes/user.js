let express = require('express');
const { encrypt, decrypt } = require('../common/encrypt.js');
let router = express.Router();

/**
 * @api {post} /api/user/submit-login 用户登录
 * @apiDescription 用户登录
 * @apiName submit-login
 * @apiGroup User
 * @apiParam {string} loginName 用户名
 * @apiParam {string} loginPass 密码
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *  {
 *      "success" : "true",
 *      "result" : {
 *          "name" : "loginName",
 *          "password" : "loginPass"
 *      }
 *  }
 * @apiSampleRequest http://localhost:4000/api/user/submit-login
 * @apiVersion 1.0.0
 */
router.post('/submit-login', function (req, res, next) {
    let loginName = req.body.loginName;
    let loginPass = req.body.loginPass;
    res.json({
        success: true,
        result: {
            name: loginName,
            password: loginPass
        }
    });
});

router.get('/encrypt', function (req, res, next) {
    // Alice's Bitcoin Address: 1McM18AHhVp6FkjGjQevskr7H755KWseM9
    const alicePub = '036b019a209248bc2e2485dca4741aa089e389b32283fc8198d8d9ac402ccb7aa9'
    const alicePriv = '395ab0d7a5a9ab9518cf9fd4b79ce567ed4ae4c413bc4c5b9c68ad4bce1ccd3b';

    // Bob's Bitcoin Address: 1DopxgTr1UqiLNQEEPqC2TbP4eqyVSvi1a
    const bobPub = '03f082645af35a40687188f87291b1e21a511731bbea804ac468ed6384ae44adbc';
    const bobPriv = '1d42b09be4d78519331f1d6034d07397322e5cb427428cdc4ac7fd04fd154f09';

    // Alice encrypts message to Bob using Bob's public key
    const message = 'Hello World!';
    const encrypted = encrypt(bobPub, alicePriv, message);

    console.log(encrypted)

    // Bob decrypts message using Alice's public key
    const decrypted = decrypt(alicePub, bobPriv, encrypted);

    console.log(message === decrypted);

    res.json({status:true,msg:'测试加密，解密过程'})
});

module.exports = router;