
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MessageSquare, Search, Users, MoreVertical, Trash2 } from "lucide-react";
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
  QueryConstraint,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthState } from "react-firebase-hooks/auth";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { deleteAllUserChats } from "@/ai/flows/delete-all-chats-flow";


type User = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
};

const userRoles = ["All", "Admin", "Teacher", "Student", "Driver"];

export default function ChatListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const { toast } = useToast();
  const [currentUser] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    const queryConstraints: QueryConstraint[] = [];
    if (roleFilter !== 'All') {
        queryConstraints.push(where("role", "==", roleFilter));
    }
    
    const q = query(collection(db, "users"), ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
            if (doc.id !== currentUser.uid) {
                const data = doc.data();
                usersData.push({
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    photoURL: data.photoURL,
                    role: data.role,
                });
            }
        });
        setUsers(usersData);
        setIsDataLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You do not have permission to view user data.",
        });
        setIsDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, roleFilter, toast]);

  const handleCreateChat = async (otherUser: User) => {
    if (!currentUser) return;

    // Check if chat already exists
    const sortedUsers = [currentUser.uid, otherUser.id].sort();
    const existingChatQuery = query(
      collection(db, "chats"),
      where("users", "==", sortedUsers)
    );

    const existingChatSnapshot = await getDocs(existingChatQuery);

    if (!existingChatSnapshot.empty) {
      // Chat already exists, navigate to it
      const chatId = existingChatSnapshot.docs[0].id;
      router.push(`/chat/${chatId}`);
    } else {
      // Create new chat
      const newChatRef = await addDoc(collection(db, "chats"), {
        users: sortedUsers,
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
  };

  const handleDeleteAllConversations = async () => {
    if (!currentUser) return;

    try {
        await deleteAllUserChats(currentUser.uid);
        toast({
            title: "All Chats Deleted",
            description: "All of your conversations have been removed.",
        });
    } catch (error) {
        console.error("Error deleting all conversations:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete all conversations. Please try again."
        });
    }
  }
  
  const filteredUsers = users.filter(user => 
    user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Start a Conversation
          </h1>
        </div>
        <AlertDialog>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete All Conversations</span>
                </DropdownMenuItem>
                </AlertDialogTrigger>
            </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all of your conversations.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleDeleteAllConversations}
                >
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
      <Card>
        <CardHeader>
             <CardTitle>All Users</CardTitle>
             <div className="flex gap-2 pt-4">
                <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Role"/>
                    </SelectTrigger>
                    <SelectContent>
                        {userRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {isDataLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="divide-y max-h-[60vh] overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-muted cursor-pointer" onClick={() => handleCreateChat(user)}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL} alt={user.name} />
                          <AvatarFallback>{user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {user.role && (
                             <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">{user.role}</span>
                        )}
                      </div>
                    </div>
                ))
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                   <Users className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Users Found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No users match the current filter.
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
