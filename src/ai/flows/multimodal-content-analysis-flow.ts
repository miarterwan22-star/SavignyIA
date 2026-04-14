'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing multimodal content.
 * Users can upload various file types (PDF, code, image, video) along with a text prompt,
 * and the AI will analyze the content and provide insights.
 *
 * - analyzeMultimodalContent - A function that handles the multimodal content analysis process.
 * - MultimodalContentAnalysisInput - The input type for the analyzeMultimodalContent function.
 * - MultimodalContentAnalysisOutput - The return type for the analyzeMultimodalContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MultimodalContentAnalysisInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "The content of the file as a data URI, including MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mimeType: z
    .string()
    .describe(
      "The MIME type of the uploaded file (e.g., 'application/pdf', 'image/jpeg', 'video/mp4', 'text/plain')."
    ),
  textPrompt: z
    .string()
    .optional()
    .describe(
      "Additional text instructions or questions for the AI regarding the uploaded content."
    ),
});
export type MultimodalContentAnalysisInput = z.infer<
  typeof MultimodalContentAnalysisInputSchema
>;

const MultimodalContentAnalysisOutputSchema = z.object({
  analysis: z.string().describe("The AI's analysis, insights, or response based on the uploaded content."),
});
export type MultimodalContentAnalysisOutput = z.infer<
  typeof MultimodalContentAnalysisOutputSchema
>;

export async function analyzeMultimodalContent(
  input: MultimodalContentAnalysisInput
): Promise<MultimodalContentAnalysisOutput> {
  return multimodalContentAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multimodalContentAnalysisPrompt',
  input: { schema: MultimodalContentAnalysisInputSchema },
  output: { schema: MultimodalContentAnalysisOutputSchema },
  prompt: `You are an expert AI assistant capable of analyzing various types of content including documents, code, images, and videos. Your task is to provide insightful analysis and respond to user queries based on the provided content.

Here is the content for your analysis:
{{media url=mediaDataUri}}

Additional instructions or questions from the user: {{{textPrompt}}}

Based on the content and instructions, provide a comprehensive analysis or response.`,
});

const multimodalContentAnalysisFlow = ai.defineFlow(
  {
    name: 'multimodalContentAnalysisFlow',
    inputSchema: MultimodalContentAnalysisInputSchema,
    outputSchema: MultimodalContentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      mediaDataUri: input.mediaDataUri,
      mimeType: input.mimeType,
      textPrompt: input.textPrompt,
    });
    return output!;
  }
);
