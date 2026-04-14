'use server';
/**
 * @fileOverview A Genkit flow for hands-free voice chat interaction with the AI.
 *
 * - handsFreeVoiceChat - A function that handles the hands-free voice chat process, sending transcribed text to the AI and returning its response.
 * - HandsFreeVoiceChatInput - The input type for the handsFreeVoiceChat function.
 * - HandsFreeVoiceChatOutput - The return type for the handsFreeVoiceChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HandsFreeVoiceChatInputSchema = z.object({
  transcript: z
    .string()
    .describe(
      'The transcribed text from the user\'s voice input, to be sent to the AI.'
    ),
});
export type HandsFreeVoiceChatInput = z.infer<
  typeof HandsFreeVoiceChatInputSchema
>;

const HandsFreeVoiceChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI\'s textual response to the user\'s input.'),
});
export type HandsFreeVoiceChatOutput = z.infer<
  typeof HandsFreeVoiceChatOutputSchema
>;

export async function handsFreeVoiceChat(
  input: HandsFreeVoiceChatInput
): Promise<HandsFreeVoiceChatOutput> {
  return handsFreeVoiceChatFlow(input);
}

const handsFreeVoiceChatPrompt = ai.definePrompt({
  name: 'handsFreeVoiceChatPrompt',
  input: {schema: HandsFreeVoiceChatInputSchema},
  output: {schema: HandsFreeVoiceChatOutputSchema},
  prompt: `The user has spoken the following message:

User: {{{transcript}}}

Respond to the user naturally and helpfully. Your response should be concise and directly address the user's input.
`,
});

const handsFreeVoiceChatFlow = ai.defineFlow(
  {
    name: 'handsFreeVoiceChatFlow',
    inputSchema: HandsFreeVoiceChatInputSchema,
    outputSchema: HandsFreeVoiceChatOutputSchema,
  },
  async (input) => {
    const {output} = await handsFreeVoiceChatPrompt(input);
    return output!;
  }
);
