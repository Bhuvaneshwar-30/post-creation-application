const { createHmac } = require('crypto');
const { hash,compare } = require('bcryptjs');


exports.doHash =(value , saltValue ) => {
    const result = hash(value, saltValue);
    return result;
};

exports.doHashvalidation = (value, hashedValue) => {
    const isValid = compare(value, hashedValue);
    return isValid;
};

exports.hmacprocess = (value,key) => {
    const result = createHmac('sha256', key).update(value).digest('hex');
    return result;
};