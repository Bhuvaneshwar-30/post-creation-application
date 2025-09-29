const jwt = require("jsonwebtoken")

exports.identify = (req, res, next) => {

    // console.log('Incoming headers:', req.headers);
    let token = req.cookies['Authorization'] || req.headers.authorization;
    // console.log('Token found:', token);
    
    if (!token){
        return res.status(401).json({ success: false, message:'Unauthorizes access'});
    }
    if(token.startsWith("Bearer ")){
        token = token.split(" ")[1];
    }

    try{
        const usertoken = token;
        const jwtVerified = jwt.verify(usertoken, process.env.TOKEN_SIGNIN);
            req.user = jwtVerified;
            next();
    }catch (error){
        console.log(error);
        if(error.name === "TokenExpiredError"){
            return res.status(401).json({ success: false,message:'Token expired,please log in again'})
        }
        return res.status(401).json({ success: false, message: 'Invalid Token' });
    }

}
