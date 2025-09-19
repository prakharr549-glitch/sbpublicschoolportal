
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

const DeleteChatInputSchema = z.string().describe("The ID of the chat to delete.");
export type DeleteChatInput = z.infer<typeof DeleteChatInputSchema>;

export async function deleteChat(chatId: DeleteChatInput): Promise<void> {
  return deleteChatFlow(chatId);
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

    let adminApp: App;
    if (!getApps().length) {
      adminApp = initializeApp();
    } else {
      adminApp = getApps()[0];
    }
    const db = getFirestore(adminApp);

    const messagesPath = `chats/${chatId}/messages`;
    const messagesRef = db.collection(messagesPath);

    try {
      const batchSize = 100;
      let query: Query = messagesRef.limit(batchSize);

      // eslint-disable-next-line no-constant-condition
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

      // After deleting the subcollection, delete the main chat document
      const chatDocRef = db.collection('chats').doc(chatId);
      await chatDocRef.delete();

    } catch (error) {
      console.error("Error deleting chat in flow:", error);
      throw new Error(`Failed to delete chat with ID ${chatId}`);
    }
  }
);
