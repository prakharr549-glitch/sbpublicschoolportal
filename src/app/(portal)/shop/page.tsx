"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2, PlusCircle, Trash2, ShoppingCart, Upload, GalleryHorizontal, Pencil } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ScrollArea } from "@/components/ui/scroll-area";


const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Price must be a positive number.")
  ),
  imageUrl: z.string().url("Please upload or select an image."),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt?: { seconds: number; nanoseconds: number; };
};

const defaultProducts: Omit<Product, 'id'>[] = [
  {
    name: "Formal Uniform",
    description: "Complete formal uniform set for all grades.",
    price: 1500,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-formal-uniform')?.imageUrl || "https://storage.googleapis.com/studio-assets/studio-images/product-formal-uniform.jpg"
  },
  {
    name: "Sports Uniform",
    description: "Comfortable sports uniform for physical activities.",
    price: 800,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-sports-uniform')?.imageUrl || "https://picsum.photos/seed/11/400/400"
  },
  {
    name: "School Tie",
    description: "Official school tie, a part of the formal uniform.",
    price: 250,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-tie')?.imageUrl || "https://picsum.photos/seed/12/400/400"
  },
  {
    name: "School Belt",
    description: "Durable school belt with the official school logo.",
    price: 200,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-belt')?.imageUrl || "https://picsum.photos/seed/13/400/400"
  },
  {
    name: "School Diary",
    description: "Student diary for the current academic session.",
    price: 150,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-diary')?.imageUrl || "https://picsum.photos/seed/14/400/400"
  },
  {
    name: "School Bag",
    description: "Sturdy and spacious backpack with school branding.",
    price: 900,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-bag')?.imageUrl || "https://picsum.photos/seed/15/400/400"
  },
  {
    name: "Notebooks Set",
    description: "A set of 6 notebooks for all subjects.",
    price: 300,
    imageUrl: PlaceHolderImages.find(p => p.id === 'product-notebooks')?.imageUrl || "https://picsum.photos/seed/16/400/400"
  }
];


export default function ShopPage() {
  const [user, authLoading] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { toast } = useToast();
  const storage = getStorage();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
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
    if (editingProduct) {
      form.reset(editingProduct);
    } else {
      form.reset({ name: "", description: "", price: 0, imageUrl: "" });
    }
  }, [editingProduct, form]);


  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const storageRef = ref(storage, `products/${user.uid}/${Date.now()}-${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      form.setValue("imageUrl", downloadURL, { shouldValidate: true });
      toast({ title: "Image Uploaded", description: "Your image has been uploaded successfully." });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: "There was a problem uploading your image." });
    } finally {
      setUploading(false);
    }
  }

  function selectFromGallery(imageUrl: string) {
    form.setValue("imageUrl", imageUrl, { shouldValidate: true });
    setIsGalleryOpen(false);
    toast({ title: "Image Selected", description: "Image from gallery has been selected." });
  }


  async function onAddSubmit(data: ProductFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to add a product." });
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
      form.reset();
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
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to edit a product." });
      return;
    }
    try {
      const productRef = doc(db, "products", editingProduct.id);
      await updateDoc(productRef, {
        ...data,
      });
      toast({
        title: "Product Updated",
        description: `${data.name} has been successfully updated.`,
      });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product: ", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was a problem updating the product.",
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
  const fileInputId = "file-upload";
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
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <Card>
                  <CardContent className="p-2">
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                        {form.watch("imageUrl") ? (
                          <Image src={form.watch("imageUrl")} alt="Product image preview" layout="fill" className="object-cover rounded-md" />
                        ) : (
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                         <Button type="button" asChild variant="outline" size="sm">
                            <label htmlFor={fileInputId} className="cursor-pointer inline-flex items-center justify-center gap-2">
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Upload Image</span>
                                <input id={fileInputId} name={fileInputId} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={uploading}/>
                            </label>
                        </Button>

                          <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                              <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="sm">
                                      <GalleryHorizontal className="mr-2 h-4 w-4" />
                                      <span>Select from Gallery</span>
                                  </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                      <DialogTitle>Select from Gallery</DialogTitle>
                                      <DialogDescription>
                                          Choose an image from the school's gallery.
                                      </DialogDescription>
                                  </DialogHeader>
                                  <ScrollArea className="h-[60vh]">
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                                      {PlaceHolderImages.filter(img => img.id.startsWith('gallery-')).map(image => (
                                          <Card key={image.id} className="cursor-pointer hover:border-primary" onClick={() => selectFromGallery(image.imageUrl)}>
                                              <CardContent className="p-0">
                                                  <div className="relative aspect-square w-full">
                                                      <Image src={image.imageUrl} alt={image.description} fill className="object-cover rounded-lg" />
                                                  </div>
                                              </CardContent>
                                          </Card>
                                      ))}
                                  </div>
                                  </ScrollArea>
                              </DialogContent>
                          </Dialog>
                      </div>
                    </div>
                    {uploading && <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2"><Loader2 className="animate-spin h-4 w-4" /> Uploading...</div>}
                  </CardContent>
                </Card>
                <FormMessage />
              </FormItem>
            )}
          />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => isEditMode ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false) }>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
            {(form.formState.isSubmitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  Fill in the details below to add a new item to the shop.
                </DialogDescription>
              </DialogHeader>
              {renderForm(false)}
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below.
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
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
                    <div className="relative aspect-square w-full bg-muted rounded-t-lg flex items-center justify-center">
                      <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-2xl font-bold">₹{item.price.toFixed(2)}</p>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2 border-t pt-4">
                    <Button className="w-full">Add to Cart</Button>
                    {user && products.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                    </Button>
                                </AlertDialogTrigger>
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
                        </div>
                    )}
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
