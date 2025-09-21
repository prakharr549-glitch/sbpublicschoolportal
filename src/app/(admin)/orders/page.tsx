
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

type OrderItem = {
    id: string;
    name: string;
    price: number;
}

type Order = {
  id: string;
  studentName: string;
  studentClass: string;
  rollNumber: string;
  phoneNumber: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  createdAt: Timestamp;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...(doc.data() as Omit<Order, 'id'>) });
      });
      setOrders(ordersData);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
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
      <div className="flex items-center gap-4">
        <ShoppingBag className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
            Shop Orders
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>A list of all orders placed through the school shop.</CardDescription>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
                {orders.length > 0 ? (
                    orders.map((order) => (
                    <AccordionItem value={order.id} key={order.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4 items-center">
                                <div>
                                    <p className="font-semibold">{order.studentName} <span className="font-normal text-muted-foreground">- {order.studentClass}</span></p>
                                    <p className="text-sm text-muted-foreground">{order.createdAt.toDate().toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">INR {order.total.toFixed(2)}</p>
                                    <Badge>{order.status}</Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">Order Details</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">INR {item.price.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <h4 className="font-semibold mt-4 mb-2">Student Information</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div><strong>Roll No:</strong> {order.rollNumber}</div>
                                    <div><strong>Phone:</strong> {order.phoneNumber}</div>
                                    <div className="col-span-2"><strong>Address:</strong> {order.address}</div>
                                </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                    ))
                ) : (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                  No orders found.
                </div>
                )}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

