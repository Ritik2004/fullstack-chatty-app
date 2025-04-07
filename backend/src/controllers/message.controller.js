import User from '../models/user.models.js'
import Message from '../models/message.model.js'
import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId,io } from '../lib/socket.js';

///this below function will give all users that we chat leaving our detail, as we don't wont to see our name
export const getUsersForSidebar = async (req,res)=>{
    try{
        //req will have user details as we are getting it from protectroute
       const loggedInUser = req.user._id;
       const filterUser = await User.find({_id: {$ne: loggedInUser}}).select("-password");
       res.status(200).json(filterUser)
    }
    catch(error){
         console.log("Error is getUserforsidebar",error.message);
         res.status(500).json({error: "Internal server error"})
    }
}

//this function is used to get all messages bw two person, so when we click on chat it gives all msg
export const getMessages = async(req,res)=>{
    try{
      const{id:userToChatId} = req.params;
      const myId = req.user._id;

      const messages = await Message.find({
        $or:[
            {senderId:myId, receiverId:userToChatId},
            {senderId:userToChatId,receiverId:myId},
        ],
      })
      res.status(200).json(messages);
    }
    catch(error){
        console.log("Error in getMessages controller",error.message);
        res.status(500).json({error: "Internal server error"})
    }
}

export const sendMessage = async(req,res)=>{
         try{
              const {text,image} = req.body;
              const{id:receiverId} = req.params;
              const senderId = req.user._id;
              let imageUrl;
              if(image){
                //upload base64 image to cloudinary
                const uploadResponse = await cloudinary.uploader.upload(image);
                imageUrl = uploadResponse.secure_url;
            }

            const newMessage = new Message({
                senderId,
                receiverId,
                text,
                image:imageUrl,
            })
             await newMessage.save();
             //real time function for socket.io comes here
             const receiverSocketId = getReceiverSocketId(receiverId)
             if(receiverSocketId){
                io.to(receiverSocketId).emit("newMessage",newMessage)
             }
             res.status(201).json(newMessage);
         }
         catch(error){
            console.log("Error in sendMessage controller: ", error.message);
            res.status(500).json({ error: "Internal server error" });
        
         }
}