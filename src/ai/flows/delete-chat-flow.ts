
'use server';
/**
 * @fileOverview A flow for deleting a chat conversation from Firestore.
 *
 * - deleteChat - A function that handles the chat deletion process.
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

const DeleteChatInputSchema = z.string().describe("The ID of the chat to delete.");
export type DeleteChatInput = z.infer<typeof DeleteChatInputSchema>;

export async function deleteChat(chatId: DeleteChatInput): Promise<void> {
  return deleteChatFlow(chatId);
}

// Helper function to delete a collection in batches
async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve(0);
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

const deleteChatFlow = ai.defineFlow(
  {
    name: 'deleteChatFlow',
    inputSchema: DeleteChatInputSchema,
    outputSchema: z.void(),
  },
  async (chatId) => {
    if (!chatId) {
      throw new Error("Chat ID is required.");
    }

    try {
      const messagesPath = `chats/${chatId}/messages`;
      await deleteCollection(messagesPath, 50);

      // After deleting the subcollection, delete the main chat document
      await db.collection('chats').doc(chatId).delete();

    } catch (error) {
      console.error("Error deleting chat in flow:", error);
      throw new Error(`Failed to delete chat with ID ${chatId}`);
    }
  }
);

    