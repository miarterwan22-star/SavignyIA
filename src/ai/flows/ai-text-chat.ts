'use server';
/**
 * @fileOverview An AI chat agent for text-based conversations with Savigny IA.
 *
 * - aiTextChat - A function that handles text chat interactions.
 * - AITextChatInput - The input type for the aiTextChat function.
 * - AITextChatOutput - The return type for the aiTextChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AITextChatInputSchema = z.object({
  message: z.string().describe('The user\'s text message to the AI.'),
});
export type AITextChatInput = z.infer<typeof AITextChatInputSchema>;

const AITextChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s conversational text response.'),
});
export type AITextChatOutput = z.infer<typeof AITextChatOutputSchema>;

export async function aiTextChat(input: AITextChatInput): Promise<AITextChatOutput> {
  return aiTextChatFlow(input);
}

const aiTextChatPrompt = ai.definePrompt({
  name: 'aiTextChatPrompt',
  input: {schema: AITextChatInputSchema},
  output: {schema: AITextChatOutputSchema},
  prompt: `You are Savigny IA, a helpful and conversational AI assistant. Respond to the user's message in a friendly and engaging manner, similar to a WhatsApp chat.

User message: {{{message}}}`,
});

const aiTextChatFlow = ai.defineFlow(
  {
    name: 'aiTextChatFlow',
    inputSchema: AITextChatInputSchema,
    outputSchema: AITextChatOutputSchema,
  },
  async input => {
    const {output} = await aiTextChatPrompt(input);
    return output!;
  }
);
