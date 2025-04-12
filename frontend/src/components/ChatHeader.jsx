import React, { useState,useRef, useEffect} from 'react'
import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Video } from 'lucide-react';
const ChatHeader = () => {
  const { selectedUser, setSelectedUser, isTyping} = useChatStore();
  const { onlineUsers, socket } = useAuthStore();
  const [calling, setCalling] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); 
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidates = useRef([]); // for queuing ICE
  const [callAccepted, setCallAccepted] = useState(false);
  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const startLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error accessing camera", err);
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteMediaStream;
    }

    pc.ontrack = (event) => {
      console.log("✅ ontrack fired", event);
      event.streams[0].getTracks().forEach((track) => {
        remoteMediaStream.addTrack(track);
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📤 Sending ICE candidate", event.candidate);
        socket.emit("ice-candidate", {
          targetUserId: selectedUser._id,
          candidate: event.candidate,
        });
      }
    };

    // Add local stream tracks
    localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    peerConnectionRef.current = pc;
  };

  const handleStartVideoCall = async () => {
    setCalling(true);
    await startLocalCamera();
    createPeerConnection();

    if (!peerConnectionRef.current) return;

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    socket.emit("call-user", {
      targetUserId: selectedUser._id,
      offer,
      callerUserId:socket.id
    });
  };

  const cancelCall = () => {
    setCalling(false);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", async ({ offer, callerSockerId }) => {
      setIncomingCall({ offer, callerSockerId });
      await startLocalCamera();
      createPeerConnection();

      const pc = peerConnectionRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      for (const candidate of pendingCandidates.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("❌ Error adding queued ICE", err);
        }
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer-call", {
        targetUserId: callerSockerId,
        answer,
      });
    });

    socket.on("call-answered", async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Flush queued ICE candidates
      for (const candidate of pendingCandidates.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("❌ Error adding queued ICE", err);
        }
      }
      pendingCandidates.current = [];
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("❄️ Received ICE candidate", candidate);

      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("❌ Error adding ICE candidate", err);
        }
      } else {
        console.log("🔁 Queuing ICE candidate until remote description is set");
        pendingCandidates.current.push(candidate);
      }
    });
    // socket.on("call-accepted", () => {
    //   console.log("Received call-accepted");
    //   setCallAccepted(true);
    //   setCalling(false); // hide “Ringing…” UI
    // });
    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
    };
  }, [socket, selectedUser, localStream]);

  const answerIncomingCall = async () => {
    if (!incomingCall) return;
    console.log("Incominf",incomingCall)
    // console.log("Emitted call-accepted")
    // socket.emit("call-accepted", {
    //   targetUserId: incomingCall.callerSockerId,
    // });
    // console.log("Emitted call-accepted")
    setCallAccepted(true);
    
      setCalling(false); 
    await startLocalCamera();
    createPeerConnection();
  
    const pc = peerConnectionRef.current;
    if (!pc) return;
  
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
  
    // Flush queued ICE
    for (const candidate of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("❌ Error adding queued ICE", err);
      }
    }
    pendingCandidates.current = [];
  
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    if(answer){
      setCallAccepted(true);
      setCalling(false); 
    }
    socket.emit("answer-call", {
      targetUserId: incomingCall.callerSockerId,
      answer,
    });
  
    setIncomingCall(null); // clear popup
  };

  return (
     <>
       {incomingCall && !callAccepted && (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 text-center shadow-lg">
        <h2 className="text-xl font-semibold">Incoming Video Call</h2>
        <p className="mt-2 text-gray-600">
          {selectedUser.fullName} is calling...
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={answerIncomingCall}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Accept
          </button>
          <button
            onClick={() => setIncomingCall(null)}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )}
  
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "../../public/vite.svg"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <div className="flex justify-center items-center gap-1">
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
              {isTyping && (
                <span className="text-xs text-gray-500 px-4">Typing...</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStartVideoCall}
            className="hover:bg-gray-100 p-2 rounded-full transition"
          >
            <Video />
          </button>
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
        {calling  && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl text-center">
              <h2 className="text-xl font-semibold">
                Calling {selectedUser.fullName}...
              </h2>
              <p className="text-gray-500 mt-2">Ringing...</p>
              <button
                onClick={cancelCall}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 📹 Add video preview for debugging */}
      {(
  <div className="flex mt-4 gap-4">
    <video
      ref={localVideoRef}
      autoPlay
      muted
      playsInline
      className="w-40 h-32 bg-black rounded-lg"
    />
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="w-40 h-32 bg-black rounded-lg"
    />
  </div>
)}
    </div>
    </>
  );
};

export default ChatHeader;
