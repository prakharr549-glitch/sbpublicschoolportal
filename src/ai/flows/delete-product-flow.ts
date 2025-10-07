'use server';
/**
 * @fileOverview A flow for deleting a product from Firestore.
 *
 * - deleteProduct - A function that handles the product deletion process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

// This flow now uses the client-side SDK, which is compatible with Next.js builds.
// The firebase config is pulled from the existing client-side setup.
const firebaseConfig = {
  projectId: "studio-4606164625-37d65",
  appId: "1:422281319062:web:9a3233c70751ce27b9a8b7",
  storageBucket: "studio-4606164625-37d65.appspot.com",
  apiKey: "AIzaSyDF9s8FC9dik7MyJE0QbJNgYCzmRjCPkSs",
  authDomain: "studio-4606164625-37d65.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "422281319062",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const DeleteProductInputSchema = z.string().describe("The ID of the product to delete.");
export type DeleteProductInput = z.infer<typeof DeleteProductInputSchema>;

export async function deleteProduct(productId: DeleteProductInput): Promise<void> {
  return deleteProductFlow(productId);
}

const deleteProductFlow = ai.defineFlow(
  {
    name: 'deleteProductFlow',
    inputSchema: DeleteProductInputSchema,
    outputSchema: z.void(),
  },
  async (productId) => {
    if (!productId) {
      throw new Error("Product ID is required.");
    }
    
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
    } catch (error) {
      console.error("Error deleting product in flow:", error);
      // It's often better to let the error propagate to be handled by the caller
      throw new Error(`Failed to delete product with ID ${productId}`);
    }
  }
);
