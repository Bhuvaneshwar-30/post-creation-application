const { required } = require('joi');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        minlength: [3, 'Name must be at least 3 characters long'],
        maxlength: [30, 'Name must be at most 30 characters long'],
        required: [true,'Name is required'],
    },
    email:{
        type: String,
        required: [true,'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [5, 'Email must be at least 5 characters long'],
    },
    password:{
        type: String,
        required: [true,'Password is required'],
        trim: true,
        select: false,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verificationcode:{
        type: String,
        select: false,
    },
    verificationcodevalidation:{
        type: Number,
        select: false,
    },
    forgetpasswordcode: {
        type: String,
        select: false,
    },
    forgetpasswordcodevalidation: {
        type: Number,
        select: false,
    },
    resetAllowed: {
    type: Boolean,
    default: false,
    select: false
    },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema); 