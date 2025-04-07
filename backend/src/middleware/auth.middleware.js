import jwt from "jsonwebtoken"
import User from "../models/user.models.js"

//In this middleware function we are checking if the user has valid jwt token, this will validate that user is loggedin

export const protectRoute = async (req,res,next)=>{
    try{
        //jwt is the name we gave to our cookie
          const token = req.cookies.jwt

          if(!token){
           return res.status(401).json({message:"Unauthorized - No token provided"})
          }
          //we are using cookie-parser to get value from jwt

          //here we will decode token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if(!decoded){
            return res.status(401).json({message:"Unauthorized - Invalid Token"})
          }
         //below we are finding user with help of userId which is inside our decoded token as we pass this id in our token
         //we don't need pwd so we deselect it
          const user = await User.findById(decoded.id).select("-password")
          if(!user){
            return res.status(401).json({message:"User not found"})
          }
           //we are passing req to user
          req.user = user;
         next();
 
    }
    catch(error){
         console.log("Error in protection meiddleware",error.message);
         return res.status(401).json({message:"Invalid server error"})
    }
}