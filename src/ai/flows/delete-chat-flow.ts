
'use server';
/**
 * @fileOverview A flow for deleting a chat conversation from Firestore.
 *
 * - deleteChat - A function that handles the chat deletion process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, Query } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Helper function to initialize Firebase Admin if not already done
function ensureFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp();
}

const DeleteChatInputSchema = z.string().describe("The ID of the chat to delete.");
export type DeleteChatInput = z.infer<typeof DeleteChatInputSchema>;

export async function deleteChat(chatId: DeleteChatInput): Promise<void> {
  return deleteChatFlow(chatId);
}

// Helper function to delete a collection in batches
async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number): Promise<void> {
  const collectionRef = db.collection(collectionPath);
  let query: Query = collectionRef.orderBy('__name__').limit(batchSize);

  while (true) {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
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
    
    const adminApp = ensureFirebaseAdmin();
    const db = getFirestore(adminApp);

    try {
      const messagesPath = `chats/${chatId}/messages`;
      await deleteCollection(db, messagesPath, 50);

      // After deleting the subcollection, delete the main chat document
      const chatDocRef = db.collection('chats').doc(chatId);
      await chatDocRef.delete();

    } catch (error) {
      console.error("Error deleting chat in flow:", error);
      throw new Error(`Failed to delete chat with ID ${chatId}`);
    }
  }
);
