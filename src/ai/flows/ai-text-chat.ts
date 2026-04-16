/**
 * @fileOverview Agent de chat texte pour Savigny IA (Côté Client).
 * Communique avec l'endpoint décentralisé configuré par l'utilisateur.
 */

export type AITextChatInput = {
  message: string;
  endpoint: string;
};

export type AITextChatOutput = {
  response: string;
};

export async function aiTextChat(input: AITextChatInput): Promise<AITextChatOutput> {
  try {
    const response = await fetch(input.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        inputs: input.message,
        parameters: { max_new_tokens: 500 }
      }),
    });

    if (!response.ok) throw new Error('Erreur serveur décentralisé');

    const data = await response.json();
    // Support de différents formats de réponse (Hugging Face Inference API ou custom)
    const text = Array.isArray(data) ? data[0]?.generated_text : (data.generated_text || data.response || data.text);
    
    return { response: text || "Je n'ai pas pu générer de réponse." };
  } catch (error) {
    console.error("Chat Error:", error);
    return { response: "Désolé, une erreur est survenue lors de la communication avec votre instance décentralisée." };
  }
}
