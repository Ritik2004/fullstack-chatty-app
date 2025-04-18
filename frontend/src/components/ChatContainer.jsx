import React, { useEffect } from 'react'
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import { useChatStore } from '../store/useChatStore';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { useAuthStore } from '../store/useAuthStore';
import {formatMessageTime} from '../lib/utils'
import { useRef } from 'react';
const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,unsubscribeToMessages,subscribeToTyping,subscribeToSeenStatus
      } = useChatStore();
      const{authUser} = useAuthStore();

      const messageEndRef = useRef(null);

      useEffect(()=>{
          getMessages(selectedUser._id)
          subscribeToMessages();
          subscribeToTyping();
          subscribeToSeenStatus();
          return ()=> unsubscribeToMessages()

      },[selectedUser._id,getMessages,subscribeToMessages,unsubscribeToMessages])
      
      useEffect(()=>{
        if(messageEndRef.current && messages){
         messageEndRef.current.scrollIntoView({behavior:"smooth"})
      }
        },[messages])

      if(isMessagesLoading) return (
        <div className='flex flex-1 flex-col overflow-auto'>
            <ChatHeader/>
            <MessageSkeleton/>
            <MessageInput/>
        </div>
      )
 
  return (
    <div className='flex flex-1 flex-col overflow-auto'>
        <ChatHeader/>
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {messages.map((message,index)=>{
            const isMyMessage = message.senderId === authUser._id;

// Check if it's the last message sent by me
          const isLastMessageByMe = isMyMessage && (
            index === messages.length - 1 ||
            !messages.slice(index + 1).some((m) => m.senderId === authUser._id)
          )
            return (
              <div 
             key={message._id}
             className={`chat ${isMyMessage? "chat-end":"chat-start"}`}
             ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className='chat-image avatar'>
                <div className='size-10 rounded-full border'>
                <img src={message.senderId === authUser._id ? authUser.profilePic
                 || '../assets/react.svg':selectedUser.profilePic
                  || '../assets/react.svg'}
                    alt='profile-pic'
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
              <div className='chat-bubble flex flex-col'>
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}

              {/* ✅ Show "Seen" only if it's the last message sent by me and it was seen */}
        {isLastMessageByMe && message.seen && (
          <span className="text-[10px] text-gray-500 mt-1 self-end">Seen</span>
        )}
              </div>
            </div>
            )
          })}
        </div>
        <MessageInput/>
    </div>
  )
}

export default ChatContainer