import {Server} from "socket.io";
import http from "http";
import express from "express";
import Message from '../models/message.model.js'
const app = express();
const server = http.createServer(app);

//use to store online user
const userSockerMap = {}  //{userId:socketId} userId comes from database 

const io = new Server(server, {
    cors:{
        origin:["http://localhost:5173"]
    }
})

//in below function we will pass a userid and will get socketid
export function getReceiverSocketId(userId){
    return userSockerMap[userId];
}


io.on("connection",(socket)=>{
    console.log("A user connected",socket.id)
    const userId = socket.handshake.query.userId;
    if(userId) userSockerMap[userId]=socket.id;
    //this below one will send it to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSockerMap));
    
    socket.on("typing", ({ senderId, receiverId }) => {
        const receiverSocketId = userSockerMap[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing", { senderId });
        }
      });


      socket.on("markMessagesAsSeen", ({ senderId, receiverId }) => {
        Message.updateMany(
          { senderId, receiverId, seen: false },
          { $set: { seen: true } }
        ).then(() => {
          const senderSocketId = getReceiverSocketId(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("messagesSeen", { receiverId });
          }
        });
      });

    socket.on("disconnect",()=>{
        console.log("A user disconnected",socket.id)
        delete userSockerMap[userId]
        io.emit("getOnlineUsers",Object.keys(userSockerMap)); 
        // getOnlineUsers is the name we give in frontend we will use this name only
    })

})

export {io ,app,server};