"use server";

import {
  analyzeNewsForEmergency,
  type EmergencyBroadcastsInput,
  type EmergencyBroadcastsOutput,
} from "@/ai/flows/emergency-broadcasts";

export async function getEmergencyAnalysis(
  headline: string
): Promise<EmergencyBroadcastsOutput> {
  const input: EmergencyBroadcastsInput = { newsHeadline: headline };
  try {
    const output = await analyzeNewsForEmergency(input);
    return output;
  } catch (error) {
    console.error("Error analyzing emergency:", error);
    // In a real app, you might want to return a more user-friendly error
    throw new Error("Failed to get analysis from AI. Please try again later.");
  }
}
