const express = require('express');
const authController = require('../controllers/authcontroller');
const { identify } = require('../middleware/identify');
const router = express.Router();

router .post('/signup',authController.signup);
router .post('/signin',authController.signin);
router .post('/signout',identify,authController.signout);

router.patch('/send-verification-code',authController.sendVerificationCode);
router.patch('/verify-verification-code',authController.verifyVerificationCode);
router.patch('/change-password',identify,authController.changePassword);
router.patch('/send-forgetpassword-code',authController.sendForgetPasswordCode);
router.patch('/verify-forgetpassword-code',authController.verifyForgetPasswordCode);
router.patch('/reset-Password',authController.resetPassword);


module.exports = router;