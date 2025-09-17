'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing news feeds and alerting school administrators to potential emergency situations.
 *
 * It includes:
 * - `analyzeNewsForEmergency` -  A function that takes news headlines as input and returns an analysis of potential emergency situations impacting the school.
 * - `EmergencyBroadcastsInput` - The input type for the analyzeNewsForEmergency function.
 * - `EmergencyBroadcastsOutput` - The return type for the analyzeNewsForEmergency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmergencyBroadcastsInputSchema = z.object({
  newsHeadline: z.string().describe('A news headline to analyze for potential emergency situations.'),
});
export type EmergencyBroadcastsInput = z.infer<typeof EmergencyBroadcastsInputSchema>;

const EmergencyBroadcastsOutputSchema = z.object({
  isEmergency: z.boolean().describe('Whether the news headline indicates a potential emergency situation impacting the school.'),
  reason: z.string().describe('The reason why the news headline is considered an emergency or not.'),
  urgencyScore: z.number().describe('Urgency score from 0 to 100, higher number means more urgent.'),
});
export type EmergencyBroadcastsOutput = z.infer<typeof EmergencyBroadcastsOutputSchema>;

export async function analyzeNewsForEmergency(input: EmergencyBroadcastsInput): Promise<EmergencyBroadcastsOutput> {
  return emergencyBroadcastsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emergencyBroadcastsPrompt',
  input: {schema: EmergencyBroadcastsInputSchema},
  output: {schema: EmergencyBroadcastsOutputSchema},
  prompt: `You are an AI assistant that analyzes news headlines to determine if they indicate a potential emergency situation that could impact S.B PUBLIC SCHOOL.

  Based on the news headline provided, determine if it represents an emergency situation for the school. Consider factors such as the proximity of the event, the severity of the event, and the potential impact on students, staff, and school operations.
  \nHeadline: {{{newsHeadline}}}
  \nRespond with JSON in the following format:
  {
  "isEmergency": true or false,
  "reason": "A brief explanation of why the headline is or is not considered an emergency.",
  "urgencyScore": A number from 0 to 100 indicating urgency (higher is more urgent).
  }
`,
});

const emergencyBroadcastsFlow = ai.defineFlow(
  {
    name: 'emergencyBroadcastsFlow',
    inputSchema: EmergencyBroadcastsInputSchema,
    outputSchema: EmergencyBroadcastsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
