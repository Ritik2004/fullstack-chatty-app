import { create } from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import { useAuthStore } from "./useAuthStore"

export const useChatStore = create((set,get)=>({
     messages:[],
     users:[],
     selectedUser:null,
     isUsersLoading:false,
     isMessagesLoading:false,
      isTyping: false,
    
     getUsers:async ()=>{
        set({isUsersLoading:true})
        try{
             const res = await axiosInstance.get("/messages/users")
             set({users:res.data})
        }
        catch(error){
          toast.error(error.response.data.message)
        }
        finally{
          set({isUsersLoading:false});
        }
     },
     getMessages:async(userId)=>{
          set({isMessagesLoading:true})
          try{
               const res = await axiosInstance.get(`/messages/${userId}`)
               const socket = useAuthStore.getState().socket;
               const { authUser } = useAuthStore.getState();
             
             socket.emit("markMessagesAsSeen", {
               senderId: userId,
               receiverId: authUser._id
               });

             set({messages:res.data})
          }
          catch(error){
               toast.error(error.response.data.message)
          }
          finally{
               set({isMessagesLoading:false})
          }
     },
     sendMessage:async(messageData)=>{
          const{selectedUser,messages} = get();
          try{
         const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`,messageData);
         set({messages:[...messages,res.data]});
          }
          catch(error){
        toast.error(error.response.data.message)
          }
     },
  subscribeToSeenStatus: () => {
  const socket = useAuthStore.getState().socket;

  socket.off("messagesSeen"); // clean previous

  socket.on("messagesSeen", ({ receiverId }) => {
    const { messages, selectedUser } = get();

    // only update if chat matches
    if (selectedUser?._id === receiverId) {
      const updatedMessages = messages.map((msg) =>
        msg.receiverId === receiverId ? { ...msg, seen: true } : msg
      );

      set({ messages: updatedMessages });
    }
  });
},
     subscribeToMessages: () => {
          const {selectedUser} = get()
          if(!selectedUser) return;
        
          const socket = useAuthStore.getState().socket;   
       
          socket.on("newMessage", (newMessage)=>{
               const ismessagesentfromselecteduser = newMessage.senderId!==selectedUser._id
               if(ismessagesentfromselecteduser) return;
                set({
                    messages:[...get().messages,newMessage],
                })
          })
     },

     unsubscribeToMessages: () => {
          const socket = useAuthStore.getState().socket;
          socket.off("newMessage")
     },
     setSelectedUser: (selectedUser)=>{
         set({selectedUser})
         get().subscribeToTyping();  
         get().subscribeToSeenStatus();
     },
     subscribeToTyping: () => {
          const socket = useAuthStore.getState().socket;

          socket.off("typing");
          
          socket.on("typing", ({ senderId }) => {
               const { selectedUser } = get();
            if (senderId === selectedUser._id) {
              set({ isTyping: true });
        
              // Clear after 2s (reset if no typing happens)
              clearTimeout(window.typingTimeout);
              window.typingTimeout = setTimeout(() => {
                set({ isTyping: false });
              }, 2000);
            }
          });
        }

}))