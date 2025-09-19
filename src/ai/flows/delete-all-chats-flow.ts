
'use server';
/**
 * @fileOverview A flow for deleting all chat conversations for a specific user from Firestore.
 *
 * - deleteAllUserChats - A function that handles the deletion of all chats for a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, Query } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

const DeleteAllUserChatsInputSchema = z.string().describe("The user ID for whom to delete all chats.");
export type DeleteAllUserChatsInput = z.infer<typeof DeleteAllUserChatsInputSchema>;

export async function deleteAllUserChats(userId: DeleteAllUserChatsInput): Promise<void> {
  return deleteAllUserChatsFlow(userId);
}

// Helper to delete a collection in batches
async function deleteCollection(query: Query) {
  const batchSize = 100;
  let snapshot = await query.limit(batchSize).get();

  while (snapshot.size > 0) {
    const batch = query.firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    snapshot = await query.limit(batchSize).get();
  }
}

const deleteAllUserChatsFlow = ai.defineFlow(
  {
    name: 'deleteAllUserChatsFlow',
    inputSchema: DeleteAllUserChatsInputSchema,
    outputSchema: z.void(),
  },
  async (userId) => {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    let adminApp: App;
    if (!getApps().length) {
      adminApp = initializeApp();
    } else {
      adminApp = getApps()[0];
    }
    const db = getFirestore(adminApp);
    
    const chatsRef = db.collection('chats');
    const userChatsQuery = chatsRef.where('users', 'array-contains', userId);

    try {
      const snapshot = await userChatsQuery.get();
      if (snapshot.empty) {
        return; // No chats to delete
      }
      
      const deletePromises: Promise<void>[] = [];
      const mainBatch = db.batch();

      snapshot.forEach(chatDoc => {
        // Delete the messages subcollection
        const messagesRef = chatDoc.ref.collection('messages');
        deletePromises.push(deleteCollection(messagesRef));

        // Add the main chat document to a batch delete
        mainBatch.delete(chatDoc.ref);
      });

      // Wait for all subcollection deletions to complete
      await Promise.all(deletePromises);

      // Commit the batch deletion of main chat documents
      await mainBatch.commit();
      
    } catch (error) {
      console.error(`Error deleting chats for user ${userId}:`, error);
      throw new Error(`Failed to delete chats for user with ID ${userId}`);
    }
  }
);
