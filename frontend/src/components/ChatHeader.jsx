import React from 'react'
import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const {
      isTyping
    } = useChatStore();
    return (
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img src={selectedUser.profilePic ||  "../../public/vite.svg"} alt={selectedUser.fullName} />
              </div>
            </div>
  
            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <div className='flex justify-center items-center gap-1'>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
              {isTyping && (
  <span className="text-xs text-gray-500 px-4">Typing...</span>
         )}
         </div>
            </div>
          </div>
  
          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    );
}

export default ChatHeader