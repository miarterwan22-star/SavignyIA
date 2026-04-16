/**
 * @fileOverview Analyse de contenu multimodal (Côté Client).
 * Envoie des fichiers vers l'endpoint médias décentralisé.
 */

export type MultimodalContentAnalysisInput = {
  mediaDataUri: string;
  mimeType: string;
  textPrompt?: string;
  endpoint: string;
};

export type MultimodalContentAnalysisOutput = {
  analysis: string;
};

export async function analyzeMultimodalContent(input: MultimodalContentAnalysisInput): Promise<MultimodalContentAnalysisOutput> {
  try {
    // Note: L'implémentation exacte dépend du type d'instance Hugging Face utilisée.
    // On envoie ici en format JSON standard.
    const response = await fetch(input.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: {
          image: input.mediaDataUri.split(',')[1], // On envoie le base64 pur
          question: input.textPrompt || "Analyse ce contenu."
        }
      }),
    });

    if (!response.ok) throw new Error('Erreur analyse média');

    const data = await response.json();
    const result = data.analysis || data.generated_text || (Array.isArray(data) ? data[0]?.generated_text : "Analyse terminée.");

    return { analysis: result };
  } catch (error) {
    return { analysis: "Échec de l'analyse du média sur votre instance." };
  }
}
