import express from 'express'
import { login, logout, signup,updateProfile,checkAuth } from '../controllers/auth.controllers.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router(); 

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout",logout)

router.put("/update-profile", protectRoute, updateProfile); //here we have this middleware protectRoute which checks if a user login
                                                       //then only let him to update profile 
                                                       //If protectRour is success then we will call updateProfile

router.get("/check", protectRoute, checkAuth); //this we are using to check whether user is authenticated we will call
                                //it whenever we refresh application we can decide where to take the user

export default router;