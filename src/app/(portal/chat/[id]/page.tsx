
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { deleteChat } from "@/ai/flows/delete-chat-flow";


type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  readBy: { [key: string]: boolean };
};

type ChatDetails = {
    userNames: { [key: string]: string };
    userAvatars: { [key: string]: string };
    users: string[];
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const { toast } = useToast();
  const [currentUser] = useAuthState(auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const otherUserId = chatDetails?.users.find(uid => uid !== currentUser?.uid);

  useEffect(() => {
    if (!currentUser || !params.id) return;

    const chatDocRef = doc(db, "chats", params.id);
    const unsubscribeChatDetails = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
            setChatDetails(doc.data() as ChatDetails);
        } else {
            toast({
                variant: "destructive",
                title: "Chat not found",
                description: "This conversation may have been deleted.",
            });
            router.replace("/chat");
        }
    });

    const messagesQuery = query(
      collection(db, "chats", params.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      async (querySnapshot) => {
        const messagesData: Message[] = [];
        const batch = writeBatch(db);
        let hasUnread = false;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Message, 'id'>;
          messagesData.push({ id: doc.id, ...data });

          // Mark message as read
          if (currentUser?.uid && data.senderId !== currentUser.uid && !data.readBy?.[currentUser.uid]) {
            hasUnread = true;
            const messageRef = doc.ref;
            batch.update(messageRef, { [`readBy.${currentUser.uid}`]: true });
          }
        });
        
        if (hasUnread && currentUser?.uid) {
          try {
            await batch.commit();
            // Update last message read status on the chat document
            const latestMessage = messagesData[messagesData.length - 1];
            if(latestMessage.senderId !== currentUser.uid) {
              await updateDoc(chatDocRef, {
                  [`lastMessageReadBy.${currentUser.uid}`]: true
              });
            }
          } catch (error) {
             // It's possible the chat was deleted between the read and the commit
            console.warn("Could not mark messages as read, chat may be deleted.", error);
          }
        }

        setMessages(messagesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        // Don't show toast if chat was deleted, as the other listener will handle it
        if (error.code !== 'permission-denied') {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load messages.",
            });
        }
        setIsLoading(false);
      }
    );

    return () => {
        unsubscribeChatDetails();
        unsubscribeMessages();
    };
  }, [currentUser, params.id, toast, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageText = newMessage;
    setNewMessage("");

    const readBy = { [currentUser.uid]: true };

    try {
      await addDoc(collection(db, "chats", params.id, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        readBy: readBy,
      });

      const chatDocRef = doc(db, "chats", params.id);
      await updateDoc(chatDocRef, {
        lastMessage: messageText,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageReadBy: readBy
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message.",
      });
      setNewMessage(messageText);
    }
  };
  
  const getParticipantDetails = (senderId: string) => {
    if (!chatDetails) return { name: "Loading...", avatar: "" };
    return {
        name: chatDetails.userNames[senderId] || "Unknown",
        avatar: chatDetails.userAvatars[senderId] || "",
    }
  }

  const otherUserName = otherUserId ? getParticipantDetails(otherUserId).name : 'Chat';

  if (!chatDetails) {
     return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
     )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-card rounded-xl border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">{otherUserName}</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          messages.map((message) => {
             const senderDetails = getParticipantDetails(message.senderId);
             const isCurrentUser = message.senderId === currentUser?.uid;

            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${isCurrentUser ? "justify-end" : ""}`}
              >
                {!isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={senderDetails.avatar} alt={senderDetails.name} />
                     <AvatarFallback>{senderDetails.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`rounded-lg p-2 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-muted-foreground">
                        {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                 {isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={senderDetails.avatar} alt={senderDetails.name} />
                     <AvatarFallback>{senderDetails.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
