'use server';
/**
 * @fileOverview A Genkit flow for converting AI text responses into spoken audio.
 *
 * - aiResponsePlayback - A function that converts a given text into an audio file using a specified voice.
 * - AIResponsePlaybackInput - The input type for the aiResponsePlayback function.
 * - AIResponsePlaybackOutput - The return type for the aiResponsePlayback function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import wav from 'wav';
import {Buffer} from 'buffer';

const AIResponsePlaybackInputSchema = z.object({
  text: z.string().describe("The AI's response text to be read aloud."),
  voiceName: z
    .string()
    .describe(
      'The name of the system voice to use for playback (e.g., "Algenib", "Achernar").'
    ),
});
export type AIResponsePlaybackInput = z.infer<typeof AIResponsePlaybackInputSchema>;

const AIResponsePlaybackOutputSchema = z.object({
  media: z
    .string()
    .describe(
      'The data URI of the generated WAV audio (e.g., "data:audio/wav;base64,...").'
    ),
});
export type AIResponsePlaybackOutput = z.infer<typeof AIResponsePlaybackOutputSchema>;

export async function aiResponsePlayback(
  input: AIResponsePlaybackInput
): Promise<AIResponsePlaybackOutput> {
  return aiResponsePlaybackFlow(input);
}

const aiResponsePlaybackFlow = ai.defineFlow(
  {
    name: 'aiResponsePlaybackFlow',
    inputSchema: AIResponsePlaybackInputSchema,
    outputSchema: AIResponsePlaybackOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: input.text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: input.voiceName},
          },
        },
      },
    });

    if (!media) {
      throw new Error('No audio media returned from the TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
