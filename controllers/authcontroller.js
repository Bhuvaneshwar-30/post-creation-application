const jwt = require("jsonwebtoken");
const { signupschema, changepasswordschema, acceptFpCodeschema, signinschema, resetPasswordschema } = require("../middleware/validation");
const User = require("../models/Usersmodel");
const { doHash, doHashvalidation, hmacprocess } = require("../utils/hashing");
const transport = require("../middleware/sendmail");
const { acceptcodeschema } = require("../middleware/validation");
const { invalid } = require("joi");


exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const { error, value } = signupschema.validate({ name, email, password });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        
        const userexists = await User.findOne({ email });

        if (userexists) {
            return res.status(401).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await doHash(password, 12);

        const newuser = new User({
            name,
            email,
            password: hashedPassword,

        })
        const result = await newuser.save();
        result.password = undefined;
        await exports.sendVerificationCode(newuser.email);
        return res.status(201).json({ success: true, message: 'User created successfully, Verification code sent', user: result });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { error, value } = signinschema.validate({ email, password });
        if (error) {
            return res.status(401)
                .json({ success: false, message: error.details[0].message });
        }
        const userexists = await User.findOne({ email }).select('+password');
        if (!userexists) {
            return res.status(401).json({ success: false, message: 'User does not exist' });
        }
        if(!userexists.verified){
            return res.status(401).json({ success: false, message: 'please verify your email'})
        }

        const result = await doHashvalidation(password, userexists.password);
        if (!result) {
            return res
                .status(401)
                .json({ success: false, message: 'Wrong Password' });
        }
        const token = jwt.sign({
            userId: userexists._id,
            email: userexists.email,
            verified: userexists.verified
        }, process.env.TOKEN_SIGNIN, { expiresIn: '8h' });

        res.cookie('Authorization', 'Bearer ' + token, {
            expire: new Date(Date.now() + 8 * 3600000),
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production'
        }).json({
            success: true,
            token,
            message: 'logged in successfully'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.signout = (req, res) => {
    res
        .clearCookie('Authorization')
        .status(200)
        .json({ success: true, message: 'Logged out successfully' });
};

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existinguser = await User.findOne({ email });
        if (!existinguser) {
            return res
                .status(404)
                .json({ success: false, message: 'User not found' });
        }
        if (existinguser.verified) {
            return res
                .status(400)
                .json({ success: false, message: 'User already verified' });
        }

        const codevalue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.EMAIL_USER,
            to: existinguser.email,
            subject: 'Verification Code',
            html:
                `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9f9f9;">
                    <h2 style="color: #4CAF50; text-align: center;">Welcome to MyApp 🎉</h2>
                    <p style="font-size: 16px; color: #333;">
                        Hi there,
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Thank you for signing up! To complete your registration, please use the verification code below:
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="display: inline-block; padding: 12px 24px; font-size: 22px; font-weight: bold; color: #fff; background-color: #4CAF50; border-radius: 6px;">
                            ${codevalue}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #555;">
                        This code will expire in <strong>10 minutes</strong>. If you didn’t request this, please ignore this email.
                    </p>
                </div>`
        })
        if (info.accepted[0] === existinguser.email) {
            const hashedvalue = hmacprocess(codevalue, process.env.HASH_SECRET);
            existinguser.verificationcode = hashedvalue;
            existinguser.verificationcodevalidation = Date.now();
            await existinguser.save();
            return res.status(200).json({ success: true, message: 'Verification code sent successfully' });
        }
        res.status(500).json({ success: false, message: 'Failed to send verification code' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.verifyVerificationCode = async (req, res) => {
    const { email, providedcode } = req.body;
    try {
        const { error, value } = acceptcodeschema.validate({ email, providedcode });
        if (error) {
            return res
                .status(401)
                .json({ status: false, messag: error.details[0].message });
        }

        const codevalue = providedcode.toString();
        const existinguser = await User.findOne({ email }).select("+verificationcode +verificationcodevalidation");

        if (!existinguser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (existinguser.verified) {
            return res.status(400).json({ success: false, message: 'User already verified' });
        }
        if (!existinguser.verificationcode || !existinguser.verificationcodevalidation) {
            return res.status(400).json({ success: false, message: 'something went wrong!!' });
        }
        if (Date.now() - existinguser.verificationcodevalidation > 10 * 60 * 1000) {
            return res.status(400).json({ success: false, message: 'Verification code expired' });
        }

        const hashedvalue = hmacprocess(codevalue, process.env.HASH_SECRET);
        if (hashedvalue === existinguser.verificationcode) {
            existinguser.verified = true;
            existinguser.verificationcode = undefined;
            existinguser.verificationcodevalidation = undefined;
            await existinguser.save();
            return res
                .status(200)
                .json({ success: true, message: 'User verified successfully' });
        }
        res
            .status(400)
            .json({ status: false, message: 'unexpected error occurred!!!' });


    } catch (error) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.changePassword = async (req, res) => {
    const { userId, verified } = req.user;
    const { oldPassword, newPassword } = req.body;
    try {
        const { error, value } = changepasswordschema.validate({ oldPassword, newPassword });
        if (error) {
            return res.status(401).json({ status: false, message: error.details[0].message });
        }
        if (!verified) {
            return res.status(401).json({ success: false, message: 'User not verified' });
        }
        const existinguser = await User.findById(userId).select('+password');
        if (!existinguser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const result = await doHashvalidation(oldPassword, existinguser.password);
        if (!result) {
            return res.status(401).json({ success: false, message: 'Invalid old password' });
        }
        const hashedPassword = await doHash(newPassword, 12);
        await User.findByIdAndUpdate(userId,{ password: hashedPassword });
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.sendForgetPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existinguser = await User.findOne({ email });
        if (!existinguser) {
            return res
                .status(404)
                .json({ success: false, message: 'User not found' });
        }
        const codevalue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.EMAIL_USER,
            to: existinguser.email,
            subject: 'Fotgot Password Code',
            html:
                `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9f9f9;">
                    <h2 style="color: #4CAF50; text-align: center;">Welcome to MyApp 🎉</h2>
                    <p style="font-size: 16px; color: #333;">
                        Hi there,
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Thank you for signing up! To complete your registration, please use the verification code below:
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="display: inline-block; padding: 12px 24px; font-size: 22px; font-weight: bold; color: #fff; background-color: #4CAF50; border-radius: 6px;">
                            ${codevalue}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #555;">
                        This code will expire in <strong>10 minutes</strong>. If you didn’t request this, please ignore this email.
                    </p>
                </div>`
        })
        if (info.accepted[0] === existinguser.email) {
            const hashedvalue = hmacprocess(codevalue, process.env.HASH_SECRET);
            existinguser.forgetpasswordcode = hashedvalue;
            existinguser.forgetpasswordcodevalidation = Date.now();
            await existinguser.save();
            return res.status(200).json({ success: true, message: 'Verification code sent successfully' });
        }
        res.status(500).json({ success: false, message: 'Failed to send verification code' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.verifyForgetPasswordCode = async (req, res) => {
    // const { email, providedcode } = req.body;
    // try {
    //     const { error, value } = acceptFpCodeschema.validate({ email, providedcode });
    //     if (error) {
    //         return res
    //             .status(401)
    //             .json({ status: false, messag: error.details[0].message });
    //     }

    //     const codevalue = providedcode.toString();
    //     const existinguser = await User.findOne({ email }).select("+forgetpasswordcode +forgetpasswordcodevalidation");

    //     if (!existinguser) {
    //         return res.status(404).json({ success: false, message: 'User not found' });
    //     }

    //     if (!existinguser.forgetpasswordcode ||!existinguser.forgetpasswordcodevalidation) {
    //         return res.status(400).json({ success: false, message: 'something went wrong!!' });
    //     }
    //     if (Date.now() - existinguser.forgetpasswordcodevalidation > 10 * 60 * 1000) {
    //         return res.status(400).json({ success: false, message: 'Verification code expired' });
    //     }

    //     if(providedcode.toString() !== existinguser.forgetpasswordcode){
    //         return res.status(400).json({success: false, message: 'Invalid Verification Code'})
    //     }

    //     const hashedvalue = hmacprocess(codevalue, process.env.HASH_SECRET);
    //     if (hashedvalue === existinguser.forgetpasswordcode) {
    //         return res.status(400).json({success: false, message: 'Invalid code'})

    //     }
    //         const hashedPassword = await doHash(newPassword, 12);
    //         existinguser.password = hashedPassword;
    //         existinguser.forgetpasswordcode = undefined;
    //         existinguser.forgetpasswordcodevalidation = undefined;
    //         await existinguser.save();
    //         return res
    //             .status(200)
    //             .json({ success: true, message: 'Code Verified You Can Reset Password' });


    // } catch (error) {
    //     console.log(err);
    //     return res.status(500).json({ success: false, message: 'Internal server error' });
    // }
    const { email, providedcode } = req.body;
    try {
        const { error } = acceptFpCodeschema.validate({ email, providedcode });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const existinguser = await User.findOne({ email }).select("+forgetpasswordcode +forgetpasswordcodevalidation +resetAllowed");
        if (!existinguser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!existinguser.forgetpasswordcode) {
            if (existinguser.resetAllowed) {
                return res.status(200).json({ success: true, message: 'Code already verified. You can reset your password.' });
            } else {

                return res.status(400).json({ success: false, message: 'Reset code not found. Please request a new password reset.' });
            }
        }

        if (!existinguser.forgetpasswordcodevalidation) {
            return res.status(400).json({ success: false, message: 'Reset code validation missing. Please request a new password reset.' });
        }
        console.log({
            email: existinguser.email,
            forgetpasswordcode: existinguser.forgetpasswordcode,
            resetAllowed: existinguser.resetAllowed,
        });


        if (Date.now() - existinguser.forgetpasswordcodevalidation > 10 * 60 * 1000) {
            return res.status(400).json({ success: false, message: 'Verification code expired' });
        }

        const codevalue = providedcode.toString();
        const hashedvalue = hmacprocess(codevalue, process.env.HASH_SECRET);
        if (hashedvalue !== existinguser.forgetpasswordcode) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        existinguser.forgetpasswordcode = undefined;
        existinguser.forgetpasswordcodevalidation = undefined;
        existinguser.resetAllowed = true;
        await existinguser.save();

        return res.status(200).json({ success: true, message: 'Code verified. You can now reset your password.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    console.log("Incoming body:", req.body); 
    const { email, newPassword } = req.body;
    try {
        const { error } = resetPasswordschema.validate({ email, newPassword });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const user = await User.findOne({ email }).select("+resetAllowed");
        if (!user) {
            return res.status(400).json({ success: false, message: 'User Not Found' });
        }
        if (!user.resetAllowed) {
            return res.status(400).json({ success: false, message: 'Reset Not Allowed Verify Your Code' })
        }
        const hashedPassword = await doHash(newPassword, 12);
        user.password = hashedPassword;
        user.resetAllowed = false;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password Reset Sucessfully' })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
};