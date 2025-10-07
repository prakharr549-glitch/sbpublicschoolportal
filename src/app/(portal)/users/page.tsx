
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MoreHorizontal, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role?: string;
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          photoURL: data.photoURL,
          role: data.role,
        });
      });
      setUsers(usersData);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to view this data.",
      });
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        User Management
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="text-right">
                        {user.phone && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <a href={`tel:${user.phone}`}>
                                        <Phone className="mr-2 h-4 w-4" />
                                        <span>Call</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`https://wa.me/${user.phone}`} target="_blank" rel="noopener noreferrer">
                                    <WhatsAppIcon className="mr-2 h-4 w-4" />
                                    <span>WhatsApp</span>
                                    </a>
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
