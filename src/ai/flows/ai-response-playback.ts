/**
 * @fileOverview Synthèse vocale décentralisée (Côté Client).
 * Utilise soit l'API Web Speech du navigateur, soit un endpoint TTS distant.
 */

export type AIResponsePlaybackInput = {
  text: string;
  voiceName?: string;
};

export type AIResponsePlaybackOutput = {
  success: boolean;
};

export async function aiResponsePlayback(input: AIResponsePlaybackInput): Promise<AIResponsePlaybackOutput> {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(input.text);
    if (input.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === input.voiceName);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
    return { success: true };
  }
  return { success: false };
}
