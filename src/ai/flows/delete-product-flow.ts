'use server';
/**
 * @fileOverview A flow for deleting a product from Firestore.
 *
 * - deleteProduct - A function that handles the product deletion process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

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
      await db.collection('products').doc(productId).delete();
    } catch (error) {
      console.error("Error deleting product in flow:", error);
      // It's often better to let the error propagate to be handled by the caller
      throw new Error(`Failed to delete product with ID ${productId}`);
    }
  }
);

    