const joi = require('joi');
const { Schema } = require('mongoose');

exports.signupschema = joi.object({
    name: joi.string().min(3).max(30).required(),
    email: joi.string()
        .min(6)
        .max(60)
        .email({
            tlds: { allow: ['com', 'net'] },
        })
        .required(),

    password: joi.string()
        .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,30}$"))
        .required()
});

exports.signinschema = joi.object({
    email: joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Please enter a valid email address",
            "any.required": "Email is required"
        }),
    password: joi.string()
        .required()
        .messages({
            "any.required": "Password is required"
        })
});

exports.acceptcodeschema = joi.object({
    email: joi.string()
        .min(6)
        .max(60)
        .email({
            tlds: { allow: ['com', 'net'] },
        })
        .required(),
    providedcode: joi.string().required()

});

exports.changepasswordschema = joi.object({
    oldPassword: joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,30}$")),
    newPassword: joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,30}$"))
});

exports.acceptFpCodeschema = joi.object({
    email: joi.string()
        .min(6)
        .max(60)
        .email({
            tlds: { allow: ['com', 'net'] },
        }),
    // newPassword: joi.string()
    //     .required()
    //     .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,30}$")),
    providedcode: joi.string().required()
});


exports.createpostsschema = joi.object({
    title: joi.string()
        .min(5)
        .max(60)
        .required(),
    description: joi.string()
        .min(3)
        .required(),
    userId: joi.string().required()
});
exports.resetPasswordschema = joi.object({
    email: joi.string().email().required(),
    newPassword: joi.string()
        .trim()
        .min(8)
        .max(30)
        .pattern(new RegExp('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,30}$'))
        .required()
        .messages({
            'any.required': 'New Password is required',
            'string.empty': 'New Password cannot be empty',
            'string.min': 'New Password must be at least 8 characters',
            'string.max': 'New Password cannot exceed 30 characters',
            'string.pattern.base': 'Password must include at least one letter, one number, and one special character',
        }),
});