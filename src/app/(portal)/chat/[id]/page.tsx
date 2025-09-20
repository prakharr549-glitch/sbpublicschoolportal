
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
} from "firebase/firestore";
import { Loader2, Send, ArrowLeft, MoreVertical, Trash2, CheckCircle } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteChat } from "@/ai/flows/delete-chat-flow";


type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  deleteAt?: Timestamp;
};

type ChatDetails = {
    userNames: { [key: string]: string };
    userAvatars: { [key: string]: string };
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const { toast } = useToast();
  const [currentUser] = useAuthState(auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || !chatId) return;

    const chatDocRef = doc(db, "chats", chatId);
    const unsubscribeChatDetails = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
            setChatDetails(doc.data() as ChatDetails);
        } else {
            // If chat is deleted, redirect away. This can be triggered
            // by the deleteChat flow.
            toast({
                title: "Chat deleted",
                description: "This conversation no longer exists.",
            });
            router.push("/chat");
        }
    });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(
      q,
      (querySnapshot) => {
        const messagesData: Message[] = [];
        const now = Timestamp.now();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.deleteAt || data.deleteAt > now) {
            messagesData.push({ id: doc.id, ...data } as Message);
          }
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
  }, [currentUser, chatId, toast, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageText = newMessage;
    setNewMessage("");

    try {
       const deleteAtTimestamp = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
      
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        deleteAt: deleteAtTimestamp,
      });
      const chatDocRef = doc(db, "chats", chatId);
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
      setNewMessage(messageText);
    }
  };
  
  const handleDeleteConversation = async () => {
    try {
        await deleteChat(chatId);
        // The snapshot listener in useEffect will detect the deletion
        // and redirect the user.
    } catch (error) {
        console.error("Error deleting conversation:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the conversation."
        });
    }
  };

  const getParticipantDetails = (senderId: string) => {
    if (!chatDetails) return { name: "Loading...", avatar: "" };
    return {
        name: chatDetails.userNames[senderId] || "Unknown",
        avatar: chatDetails.userAvatars[senderId] || "",
    }
  }

  const otherUserId = chatDetails && Object.keys(chatDetails.userNames).find(userId => userId !== currentUser?.uid);
  const otherUserName = otherUserId ? getParticipantDetails(otherUserId).name : 'Chat';

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
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-muted-foreground">
                        {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isCurrentUser && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
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
