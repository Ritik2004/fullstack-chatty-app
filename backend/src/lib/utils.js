import jwt from "jsonwebtoken"

export const generateToken = (userId,res) => {
    const token = jwt.sign({id: userId},process.env.JWT_SECRET,{
        expiresIn:"7d"
    })  
    //now we can send this to cookie
    res.cookie("jwt",token,{
        maxAge:7*24*60*60*1000,  //MS live for days
        httpOnly:true, //prevents XSS attack 
        sameSite:"strict", // prevents CSRF attack
        // secure:process.env.NODE_ENV !=="development"
        secure:false
        //this above line says it wil be true in production
    }) 
   return token
}
