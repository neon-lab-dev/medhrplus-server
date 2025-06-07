const {check, validationResult} = require('express-validator');

// for signup
exports.validateRequest = [
    check('name')
    .notEmpty()
    .withMessage('name is required'),
    check('fathername')
    .notEmpty()
    .withMessage('father name is required'),
    check('age')
    .notEmpty()
    .withMessage('age is required'),
    check('gender')
    .notEmpty()
    .withMessage('gender is required'),
    check('role')
    .notEmpty()
    .withMessage('role is required'),
    check('address')
    .notEmpty()
    .withMessage('address is required'),
    check('location')
    .notEmpty()
    .withMessage('location is required'),
    check('city')
    .notEmpty()
    .withMessage('city is required'),
    check('district')
    .notEmpty()
    .withMessage('district is required'),
    check('state')
    .notEmpty()
    .withMessage('state is required'),
    check('pincode')
    .notEmpty()
    .withMessage('pincode is required'),
    check('mobile')
    .isMobilePhone()
    .isLength({min: 10})
    .withMessage('Invalid mobile'),
    check('email')
    .isEmail()
    .withMessage('Invalid email')
    // ,
    // check('password')
    // .isLength({min: 6})
    // .withMessage('Password length must be 6 digit.4')
];


// for EmployerSignup
exports.EmployerValidateRequest = [
    check('industryType')
    .notEmpty()
    .withMessage('Industry Type is required'),
    check('name')
    .notEmpty()
    .withMessage('name is required'),
    check('contactPerson')
    .notEmpty()
    .withMessage('contact Person name is required'),
    check('responsibilities')
    .notEmpty()
    .withMessage('responsibilities is required'),
    check('organization')
    .notEmpty()
    .withMessage('organization is required'),


    check('location')
    .notEmpty()
    .withMessage('location is required'),
    check('city')
    .notEmpty()
    .withMessage('city is required'),
    check('country')
    .notEmpty()
    .withMessage('country is required'),

    
    check('mobile')
    .isMobilePhone()
    .isLength({min: 10})
    .withMessage('Invalid mobile'),
    check('email')
    .isEmail()
    .withMessage('Invalid email')
    // ,
    // check('password')
    // .isLength({min: 6})
    // .withMessage('Password length must be 6 digit.4')
];


// for signin
exports.validatesigninRequest = [
    check('phone')
    .isMobilePhone()
    .isLength({min: 10})
    .withMessage('Invalid phone number'),
    check('role')
    .notEmpty()
    .withMessage('please select role'),
    check('password')
    .isLength({min: 6})
    .withMessage('Password length must be 6 digit.4')
];

exports.validChangePwdRequest = [
    check('phone')
    .isMobilePhone()
    .isLength({min: 10})
    .withMessage('Invalid phone number'),
    check('role')
    .notEmpty()
    .withMessage('please select role'),
    check('oldPassword')
    .isLength({min: 2})
    .withMessage('Password length must be 6 digit.4'),
    check('newPassword')
    .isLength({min: 2})
    .withMessage('Password length must be 6 digit.4')
];

exports.otpValidationReq = [
    check('phone')
    .isMobilePhone()
    .isLength({min: 10})
    .withMessage('Invalid phone number')
];

exports.otpVerifyReq = [
    check('phone')
    .isMobilePhone()
    .isLength({min: 10})
    .withMessage('Invalid phone number'),
    check('otp')
    .isLength({min: 4})
    .withMessage('please fill valid otp')
];


exports.isRequestValidated = (req, res, next) => {
    const errors =  validationResult(req);
    if(errors.array().length > 0){
        return res.status(400).json({error: errors.array()[0].msg });
    }
    
    next();
};