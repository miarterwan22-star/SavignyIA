/**
 * @fileOverview Agent vocal pour Savigny IA (Côté Client).
 * Transforme le texte transcrit en réponse via l'endpoint décentralisé.
 */

export type HandsFreeVoiceChatInput = {
  transcript: string;
  endpoint: string;
};

export type HandsFreeVoiceChatOutput = {
  aiResponse: string;
};

export async function handsFreeVoiceChat(input: HandsFreeVoiceChatInput): Promise<HandsFreeVoiceChatOutput> {
  try {
    const response = await fetch(input.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        inputs: `Réponds brièvement à cette commande vocale : ${input.transcript}`,
      }),
    });

    if (!response.ok) throw new Error('Erreur serveur vocal');

    const data = await response.json();
    const text = Array.isArray(data) ? data[0]?.generated_text : (data.generated_text || data.response || data.text);
    
    return { aiResponse: text || "Commande vocale reçue mais non traitée." };
  } catch (error) {
    return { aiResponse: "Erreur de connexion vocale." };
  }
}
