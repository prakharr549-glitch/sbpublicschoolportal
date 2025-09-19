
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MessageSquare, Plus, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
};

type Chat = {
  id: string;
  users: string[];
  userNames: { [key: string]: string };
  userAvatars: { [key: string]: string };
  lastMessage?: string;
  lastMessageTimestamp?: any;
};

export default function ChatListPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
          const data = doc.data();
          chatsData.push({
            id: doc.id,
            users: data.users,
            userNames: data.userNames || {},
            userAvatars: data.userAvatars || {},
            lastMessage: data.lastMessage,
            lastMessageTimestamp: data.lastMessageTimestamp,
          });
        });
        setChats(chatsData.sort((a, b) => (b.lastMessageTimestamp?.seconds || 0) - (a.lastMessageTimestamp?.seconds || 0)));
        setIsDataLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You do not have permission to view this data.",
        });
        setIsDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, toast]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      setIsUsersLoading(true);
      const fetchUsers = async () => {
        const usersQuery = query(
          collection(db, "users"),
          where("name", ">=", searchTerm),
          where("name", "<=", searchTerm + "\uf8ff")
        );
        const querySnapshot = await getDocs(usersQuery);
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== currentUser?.uid) {
            const data = doc.data();
            usersData.push({
              id: doc.id,
              name: data.name,
              email: data.email,
              photoURL: data.photoURL,
            });
          }
        });
        setUsers(usersData);
        setIsUsersLoading(false);
      };
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm, currentUser?.uid]);

  const handleCreateChat = async (otherUser: User) => {
    if (!currentUser) return;

    // Check if chat already exists
    const existingChatQuery = query(
      collection(db, "chats"),
      where("users", "==", [currentUser.uid, otherUser.id].sort())
    );
    const existingChatSnapshot = await getDocs(existingChatQuery);

    if (!existingChatSnapshot.empty) {
      // Chat already exists, navigate to it
      const chatId = existingChatSnapshot.docs[0].id;
      router.push(`/chat/${chatId}`);
    } else {
      // Create new chat
      const newChatRef = await addDoc(collection(db, "chats"), {
        users: [currentUser.uid, otherUser.id].sort(),
        userNames: {
          [currentUser.uid]: currentUser.displayName,
          [otherUser.id]: otherUser.name,
        },
        userAvatars: {
          [currentUser.uid]: currentUser.photoURL || "",
          [otherUser.id]: otherUser.photoURL || "",
        },
        createdAt: serverTimestamp(),
      });
      router.push(`/chat/${newChatRef.id}`);
    }
    setIsDialogOpen(false);
  };

  const getOtherUser = (chat: Chat) => {
    const otherUserId = chat.users.find((uid) => uid !== currentUser?.uid);
    if (!otherUserId) return { name: "Unknown", avatar: "" };
    return {
      name: chat.userNames[otherUserId] || "Unknown User",
      avatar: chat.userAvatars[otherUserId] || "",
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Conversations
          </h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Chat</DialogTitle>
              <DialogDescription>
                Search for a user to start a conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {isUsersLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleCreateChat(user)}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ))
              )}
               {searchTerm.length > 2 && !isUsersLoading && users.length === 0 && (
                 <p className="text-center text-muted-foreground py-4">No users found.</p>
               )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          {isDataLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="divide-y">
              {chats.length > 0 ? (
                chats.map((chat) => {
                  const otherUser = getOtherUser(chat);
                  return (
                  <Link href={`/chat/${chat.id}`} key={chat.id}>
                    <div className="p-4 hover:bg-muted cursor-pointer">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                          <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{otherUser.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || "No messages yet."}</p>
                        </div>
                         {chat.lastMessageTimestamp && (
                            <p className="text-xs text-muted-foreground">
                                {new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )})
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                   <Users className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Conversations</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start a new chat to see it listed here.
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
