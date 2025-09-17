'use server';
/**
 * @fileOverview An AI flow for answering student questions.
 *
 * - answerQuestion - A function that provides answers to student questions.
 * - AnswerQuestionInput - The input type for the answerQuestion function.
 * - AnswerQuestionOutput - The return type for the answerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnswerQuestionInputSchema = z.string();
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.string();
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return schoolAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'schoolAiPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are a friendly and knowledgeable AI school assistant. Your goal is to help students with their homework and answer their questions in a clear, concise, and educational manner.

When a student asks a question, provide a step-by-step explanation if it's a problem to be solved. If it's a factual question, give a direct answer and then provide some interesting context or related facts.

Always maintain a positive and encouraging tone. Do not simply give the answer, but guide the student to understand the concept.

Student's question: {{{input}}}`,
});

const schoolAiFlow = ai.defineFlow(
  {
    name: 'schoolAiFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
