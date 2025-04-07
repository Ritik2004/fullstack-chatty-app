import {Server} from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin:["http://localhost:5173"]
    }
})
export function getReceiverSocketId(userId){
    return userSockerMap[userId];
}


//use to store online user
const userSockerMap = {}  //{userId:socketId} userId comes from database

io.on("connection",(socket)=>{
    console.log("A user connected",socket.id)
    const userId = socket.handshake.query.userId;
    if(userId) userSockerMap[userId]=socket.id;
    //this below one will send it to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSockerMap));

    socket.on("disconnect",()=>{
        console.log("A user disconnected",socket.id)
        delete userSockerMap[userId]
        io.emit("getOnlineUsers",Object.keys(userSockerMap)); 
        // getOnlineUsers is the name we give in frontend we will use this name only
    })

})

export {io ,app,server};