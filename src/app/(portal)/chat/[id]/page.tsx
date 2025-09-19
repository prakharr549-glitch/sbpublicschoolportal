
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
} from "firebase/firestore";
import { Loader2, Send, ArrowLeft, User, Bot } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
};

type ChatDetails = {
    userNames: { [key: string]: string };
    userAvatars: { [key: string]: string };
}

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const { toast } = useToast();
  const [currentUser] = useAuthState(auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || !id) return;

    // Fetch chat details
    const chatDocRef = doc(db, "chats", id);
    const unsubscribeChatDetails = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
            setChatDetails(doc.data() as ChatDetails);
        }
    });

    // Fetch messages
    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(
      q,
      (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(messagesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load messages.",
        });
        setIsLoading(false);
      }
    );

    return () => {
        unsubscribeChatDetails();
        unsubscribeMessages();
    };
  }, [currentUser, id, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageText = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, "chats", id, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      // Update last message in the chat document
      const chatDocRef = doc(db, "chats", id);
      await updateDoc(chatDocRef, {
        lastMessage: messageText,
        lastMessageTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message.",
      });
      // Re-set the input field with the message that failed to send
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
  
  const otherUserId = chatDetails && Object.keys(chatDetails.userNames).find(id => id !== currentUser?.uid);
  const otherUserName = otherUserId ? getParticipantDetails(otherUserId).name : 'Chat';

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-card rounded-xl border">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">{otherUserName}</h2>
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
                <div className="flex flex-col">
                  <div
                    className={`rounded-lg p-3 max-w-xs ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                     {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
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
