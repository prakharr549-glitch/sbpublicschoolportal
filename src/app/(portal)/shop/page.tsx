
"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, doc, updateDoc, Timestamp, orderBy, limit, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2, PlusCircle, Trash2, ShoppingCart, Pencil, MoreHorizontal, X, Lock, ShoppingBag, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deleteProduct } from "@/ai/flows/delete-product-flow";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Price must be a positive number.")
  ),
});

const checkoutFormSchema = z.object({
    studentName: z.string().min(2, "Student name is required."),
    studentClass: z.string().min(1, "Class is required."),
    age: z.preprocess(
      (a) => parseInt(z.string().parse(a), 10),
      z.number().positive("Age must be a positive number.")
    ),
    phoneNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number."),
    address: z.string().min(10, "Address is required."),
    rollNumber: z.string().min(1, "Roll number is required."),
});

type ProductFormValues = z.infer<typeof productFormSchema>;
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt?: Timestamp;
};

const defaultProducts: Omit<Product, 'id' | 'createdAt'>[] = [
    {
        name: "Formal Uniform",
        description: "Complete formal uniform set for all grades.",
        price: 1500,
    },
    {
        name: "Sports Uniform",
        description: "Comfortable sports uniform for physical activities.",
        price: 800,
    },
    {
        name: "School Tie",
        description: "Official school tie, a part of the formal uniform.",
        price: 250,
    },
    {
        name: "School Belt",
        description: "Durable school belt with the official school logo.",
        price: 200,
    },
    {
        name: "School Diary",
        description: "Student diary for the current academic session.",
        price: 150,
    },
    {
        name: "School Bag",
        description: "Sturdy and spacious backpack with school branding.",
        price: 900,
    },
    {
        name: "Notebooks Set",
        description: "A set of 6 notebooks for all subjects.",
        price: 300,
    }
];


export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [protectedAction, setProtectedAction] = useState<(() => void) | null>(null);
  const [user, authLoading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const canManage = userRole === 'Admin';
  const isStudent = userRole === 'Student';


  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
    },
  });

  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
        studentName: "",
        studentClass: "",
        age: "" as any,
        phoneNumber: "",
        address: "",
        rollNumber: "",
    },
  });
  
  useEffect(() => {
    if (user && !authLoading) {
      const userDocRef = doc(db, "users", user.uid);
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      });
    }
  }, [user, authLoading]);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) });
      });
      setProducts(productsData);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to view products.",
      });
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  useEffect(() => {
    if (isAddDialogOpen) {
      form.reset({ name: "", description: "", price: 0 });
    }
  }, [isAddDialogOpen, form]);


  useEffect(() => {
    if (isEditDialogOpen && editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
      });
    }
  }, [editingProduct, form, isEditDialogOpen]);
  
  const handlePasswordVerification = () => {
    if (passwordInput === '355995') {
      if (protectedAction) {
        protectedAction();
      }
      setIsPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      setProtectedAction(null);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };
  
  const requestPassword = (action: () => void) => {
    setProtectedAction(() => action);
    setIsPasswordDialogOpen(true);
  }

  async function onAddSubmit(data: ProductFormValues) {
    try {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: Timestamp.now(),
      });
      toast({
        title: "Product Added",
        description: `${data.name} has been added to the shop.`,
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding product: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the product.",
      });
    }
  }
  
  async function onEditSubmit(data: ProductFormValues) {
    if (!editingProduct) {
      toast({ variant: "destructive", title: "Error", description: "No product selected for editing." });
      return;
    }
    try {
      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
      };

      if (editingProduct.id.startsWith('default-')) {
         await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: Timestamp.now(),
        });
         toast({
          title: "Product Created",
          description: `${data.name} has been added to the shop.`,
        });
      } else {
        const productRef = doc(db, "products", editingProduct.id);
        await updateDoc(productRef, productData);
        toast({
          title: "Product Updated",
          description: `${data.name} has been successfully updated.`,
        });
      }

      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product: ", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There was a problem saving the product.",
      });
    }
  }


  async function handleDelete(productId: string) {
    if (productId.startsWith('default-')) return;
    try {
      await deleteProduct(productId);
      toast({
        title: "Product Deleted",
        description: "The product has been successfully removed from the shop.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the product.",
      });
    }
  }
  
  const handleEditClick = (product: Product) => {
    requestPassword(() => {
        setEditingProduct(product);
        setIsEditDialogOpen(true);
    });
  };
  
  const handleAddToCart = (product: Product) => {
    setCart(prevCart => [...prevCart, product]);
    toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
    });
  };

  const handleRemoveFromCart = (productId: string, removeAll = false) => {
    setCart(prevCart => {
      if (removeAll) {
        return prevCart.filter(p => p.id !== productId);
      }
      const productIndex = prevCart.findIndex(p => p.id === productId);
      if (productIndex > -1) {
        const newCart = [...prevCart];
        newCart.splice(productIndex, 1);
        return newCart;
      }
      return prevCart;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, product) => total + product.price, 0);
  };

  const onCheckoutSubmit = async (data: CheckoutFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to place an order.'});
        return;
    }

    const phoneNumber = "6392702249";
    const cartItemsText = cart.map(item => `- ${item.name} (INR ${item.price.toFixed(2)})`).join('\\n');
    const total = getCartTotal();

    const message = `
*New Order Request*

*Student Details:*
Name: ${data.studentName}
Class: ${data.studentClass}
Age: ${data.age}
Phone: ${data.phoneNumber}
Address: ${data.address}
Roll No: ${data.rollNumber}

*Order Summary:*
${cartItemsText}

*Total Amount: INR ${total.toFixed(2)}*
    `.trim();

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    try {
        // Save order to Firestore
        await addDoc(collection(db, "orders"), {
            ...data,
            userId: user.uid,
            items: cart.map(item => ({ id: item.id, name: item.name, price: item.price })),
            total: total,
            createdAt: Timestamp.now(),
            status: 'Pending',
        });

        window.open(whatsappUrl, '_blank');
        toast({
            title: "Redirecting to WhatsApp",
            description: "Please send the pre-filled message to complete your order.",
        });
        setCart([]);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        checkoutForm.reset();
    } catch (error) {
        console.error("Failed to open WhatsApp or save order:", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "Could not place the order. Please try again.",
        });
    }
  };


  const isLoading = authLoading || isDataLoading;
  const displayedProducts = products.length > 0 ? products : defaultProducts.map((p, i) => ({...p, id: `default-${i}`}));
  
  const renderProductForm = (isEditMode: boolean) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(isEditMode ? onEditSubmit : onAddSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., School T-Shirt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Comfortable cotton t-shirt with school branding." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (in INR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 300" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
              if (isEditMode) {
                  setIsEditDialogOpen(false);
                  setEditingProduct(null);
              } else {
                  setIsAddDialogOpen(false);
              }
          }}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {(form.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          School Shop
        </h1>
        <div className="flex items-center gap-2">
            {isStudent && (
                <Button asChild variant="outline">
                    <Link href="/my-orders">
                        <History className="mr-2 h-4 w-4" />
                        My Orders
                    </Link>
                </Button>
            )}
            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">
                      {cart.length}
                    </Badge>
                  )}
                  <span className="sr-only">Open Cart</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Your Shopping Cart</DialogTitle>
                  <DialogDescription>
                    Review the items in your cart below.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground">Your cart is empty.</p>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">INR {item.price.toFixed(2)}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id, true)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>INR {getCartTotal().toFixed(2)}</p>
                    </div>
                    <DialogFooter>
                        <Button className="w-full" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>Proceed to Checkout</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {canManage && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Shop Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => requestPassword(() => setIsAddDialogOpen(true))}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Add Product</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/orders">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                <span>View All Orders</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </div>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the product details below.</DialogDescription>
          </DialogHeader>
          {renderProductForm(false)}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPasswordDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setPasswordInput('');
              setPasswordError('');
              setProtectedAction(null);
          }
          setIsPasswordDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Admin Access Required</DialogTitle>
                <DialogDescription>
                    Please enter the administrator password to continue.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordVerification(); }}>
                <div className="space-y-4 py-2 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password"
                        />
                        {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">
                        <Lock className="mr-2 h-4 w-4"/>
                        Verify
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setEditingProduct(null);
          }
          setIsEditDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && renderProductForm(true)}
        </DialogContent>
      </Dialog>
       
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>
                    Please provide student details to complete the order.
                </DialogDescription>
            </DialogHeader>
            <FormProvider {...checkoutForm}>
                <form onSubmit={checkoutForm.handleSubmit(onCheckoutSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                     <FormField
                        control={checkoutForm.control}
                        name="studentName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Student Name</FormLabel>
                                <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={checkoutForm.control}
                            name="studentClass"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class</FormLabel>
                                    <FormControl><Input placeholder="e.g., Grade 5" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={checkoutForm.control}
                            name="rollNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Roll No.</FormLabel>
                                    <FormControl><Input placeholder="e.g., 21" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={checkoutForm.control}
                        name="age"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={checkoutForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl><Input type="tel" placeholder="10-digit number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={checkoutForm.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl><Textarea placeholder="Full residential address" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <DialogFooter className="mt-4 pt-4 border-t sticky bottom-0 bg-background">
                        <Button type="button" variant="outline" onClick={() => { setIsCheckoutOpen(false); setIsCartOpen(true);}}>Back to Cart</Button>
                        <Button type="submit" disabled={checkoutForm.formState.isSubmitting}>
                            {checkoutForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Place Order via WhatsApp
                        </Button>
                    </DialogFooter>
                </form>
            </FormProvider>
        </DialogContent>
      </Dialog>


        {isLoading ? (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedProducts.map((item) => (
                <Card key={item.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="font-headline">{item.name}</CardTitle>
                             {canManage && (
                                <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEditClick(item as Product)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()} disabled={item.id.startsWith('default-')} >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the product "{item.name}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => requestPassword(() => handleDelete(item.id))}
                                    >
                                        Continue
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 pt-0">
                         <CardDescription>{item.description}</CardDescription>
                         <p className="text-2xl font-bold">INR {item.price.toFixed(2)}</p>
                    </CardContent>
                    <CardFooter>
                         <Button className="w-full" onClick={() => handleAddToCart(item as Product)}>Add to Cart</Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
        ) : (
             <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <ShoppingCart className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
                        <p className="mt-2 text-sm">Products added by an administrator will appear here.</p>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
