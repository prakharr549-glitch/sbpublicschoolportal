
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { addDoc, collection, onSnapshot, query, doc, deleteDoc, orderBy, limit, updateDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2, PlusCircle, Trash2, ShoppingCart, Pencil, MoreHorizontal } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Price must be a positive number.")
  ),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

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
  const [user, authLoading] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
    },
  });

  useEffect(() => {
    if (authLoading) return;

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
  }, [user, authLoading, toast]);
  
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


  async function onAddSubmit(data: ProductFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add a product." });
      return;
    }
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
    if (!user || !editingProduct) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in and editing a product." });
      return;
    }
    try {
      const isDefaultProduct = editingProduct.id.startsWith('default-');
      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
      };

      if (isDefaultProduct) {
        // This is a default product, so create a new document in Firestore
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: Timestamp.now(),
        });
         toast({
          title: "Product Created",
          description: `${data.name} has been added to the shop.`,
        });
      } else {
        // This is an existing product, so update it
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
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to delete a product." });
      return;
    }
    try {
      await deleteDoc(doc(db, "products", productId));
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
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };


  const isLoading = authLoading || isDataLoading;
  const displayedProducts = products.length > 0 ? products : defaultProducts.map((p, i) => ({...p, id: `default-${i}`}));
  
  const renderForm = (isEditMode: boolean) => (
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
                <FormLabel>Price (in Rupees)</FormLabel>
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
        {user && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill in the product details below.
                </DialogDescription>
              </DialogHeader>
              {renderForm(false)}
            </DialogContent>
          </Dialog>
        )}
      </div>
      
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
          {editingProduct && renderForm(true)}
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
                             {user && (
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
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={item.id.startsWith('default-')} >
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
                                        onClick={() => handleDelete(item.id)}
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
                         <Button className="w-full">Add to Cart</Button>
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
