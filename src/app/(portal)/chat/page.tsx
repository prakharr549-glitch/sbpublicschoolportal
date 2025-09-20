
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MessageSquare, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Chat = {
  id: string;
  users: string[];
  userNames: { [key: string]: string };
  userAvatars: { [key: string]: string };
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageReadBy?: { [key: string]: boolean };
};

export default function ChatListPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const [currentUser] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const chatsData: Chat[] = [];
        querySnapshot.forEach((doc) => {
          chatsData.push({ id: doc.id, ...(doc.data() as Omit<Chat, 'id'>) });
        });
        
        // Sort chats by lastMessageTimestamp on the client side
        chatsData.sort((a, b) => {
            const timeA = a.lastMessageTimestamp?.toMillis() || 0;
            const timeB = b.lastMessageTimestamp?.toMillis() || 0;
            return timeB - timeA;
        });

        setChats(chatsData);
        setIsDataLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You do not have permission to view your chats.",
        });
        setIsDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, toast]);
  
  const getOtherParticipant = (chat: Chat) => {
    if (!currentUser) return { id: '', name: 'Chat', avatar: '' };
    const otherUserId = chat.users.find(uid => uid !== currentUser.uid) || '';
    return {
        id: otherUserId,
        name: chat.userNames[otherUserId] || 'Chat',
        avatar: chat.userAvatars[otherUserId] || ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Conversations
          </h1>
        </div>
         <Button asChild>
          <Link href="/chat/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Start New Chat
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
             <CardTitle>Recent Chats</CardTitle>
             <CardDescription>Select a conversation to continue chatting.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isDataLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="divide-y max-h-[60vh] overflow-y-auto">
              {chats.length > 0 ? (
                chats.map((chat) => {
                    const otherUser = getOtherParticipant(chat);
                    const isUnread = chat.lastMessage && (!chat.lastMessageReadBy || !chat.lastMessageReadBy[currentUser!.uid]);

                    return (
                        <div key={chat.id} className="p-4 hover:bg-muted cursor-pointer" onClick={() => router.push(`/chat/${chat.id}`)}>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                              <AvatarFallback>{otherUser.name.charAt(0) ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">{otherUser.name}</p>
                                {chat.lastMessageTimestamp && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(chat.lastMessageTimestamp.toDate(), { addSuffix: true })}
                                    </p>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <p className={cn("text-sm text-muted-foreground truncate", isUnread && "font-bold text-foreground")}>
                                    {chat.lastMessage || "No messages yet"}
                                </p>
                                {isUnread && (
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    )
                })
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                   <MessageSquare className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Conversations</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click 'Start New Chat' to begin a conversation.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
