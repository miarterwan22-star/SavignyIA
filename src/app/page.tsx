"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Settings, 
  Volume2, 
  Mic, 
  MicOff, 
  Moon, 
  Sun, 
  FileText, 
  Code as CodeIcon, 
  Music, 
  Image as ImageIcon, 
  Video,
  Cpu,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiTextChat } from '@/ai/flows/ai-text-chat';
import { handsFreeVoiceChat } from '@/ai/flows/hands-free-voice-chat';
import { analyzeMultimodalContent } from '@/ai/flows/multimodal-content-analysis-flow';
import { aiResponsePlayback } from '@/ai/flows/ai-response-playback';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  type?: 'text' | 'file';
};

export default function SavignyIAApp() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Configuration terminée. Je suis Savigny IA, prêt à vous assister via vos serveurs décentralisés.',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  
  const [lienCerveau, setLienCerveau] = useState('');
  const [lienMedias, setLienMedias] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceName) {
        setSelectedVoiceName(availableVoices[0].name);
      }
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSendMessage(transcript, true);
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [isDarkMode]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (isConfigured) scrollToBottom();
  }, [messages, isLoading, isConfigured]);

  const handleSendMessage = async (text: string = inputText, fromVoice: boolean = false) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let result;
      if (fromVoice) {
        result = await handsFreeVoiceChat({ transcript: text, endpoint: lienCerveau });
        handleResponse(result.aiResponse);
      } else {
        result = await aiTextChat({ message: text, endpoint: lienCerveau });
        handleResponse(result.response);
      }
    } catch (error) {
      handleResponse("Impossible de joindre votre instance décentralisée.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = (aiText: string) => {
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: aiText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleSpeech = (text: string) => {
    aiResponsePlayback({ text, voiceName: selectedVoiceName });
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setIsLoading(true);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: `Fichier envoyé (${type}): ${file.name}`,
        timestamp: new Date(),
        type: 'file'
      }]);

      try {
        const endpoint = (type === 'image' || type === 'video' || type === 'audio') && lienMedias 
          ? lienMedias 
          : lienCerveau;

        const result = await analyzeMultimodalContent({
          mediaDataUri: base64,
          mimeType: file.type,
          endpoint: endpoint,
          textPrompt: `Analyse ce contenu de type ${type}.`
        });
        handleResponse(result.analysis);
      } catch (error) {
        handleResponse("Erreur lors de l'analyse du média.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isConfigured) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-savigny-dark text-white">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-3xl bg-savigny-indigo mx-auto flex items-center justify-center text-3xl font-bold shadow-2xl mb-6">S</div>
            <h1 className="text-3xl font-extrabold tracking-tight">Savigny IA</h1>
            <p className="text-muted-foreground">Configuration décentralisée</p>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cpu className="w-4 h-4 text-savigny-indigo" /> Lien Cerveau (Obligatoire)</Label>
                <Input 
                  placeholder="https://user-brain.hf.space" 
                  className="bg-savigny-dark/50"
                  value={lienCerveau}
                  onChange={(e) => setLienCerveau(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-savigny-cyan" /> Lien Médias (Facultatif)</Label>
                <Input 
                  placeholder="https://user-media.hf.space" 
                  className="bg-savigny-dark/50"
                  value={lienMedias}
                  onChange={(e) => setLienMedias(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl bg-savigny-indigo font-bold transition-all shadow-lg"
              disabled={!lienCerveau.trim()}
              onClick={() => setIsConfigured(true)}
            >
              Démarrer <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <header className="h-16 flex items-center justify-between px-4 border-b z-10 glass-morphism sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-savigny-indigo flex items-center justify-center text-white font-bold">S</div>
          <div>
            <h1 className="text-lg font-bold leading-none">Savigny IA</h1>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Décentralisé
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun className="w-5 h-5 text-savigny-cyan" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Configuration</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Lien Cerveau</Label>
                  <Input value={lienCerveau} onChange={(e) => setLienCerveau(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Lien Médias</Label>
                  <Input value={lienMedias} onChange={(e) => setLienMedias(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Voix</Label>
                  <Select value={selectedVoiceName} onValueChange={setSelectedVoiceName}>
                    <SelectTrigger><SelectValue placeholder="Voix" /></SelectTrigger>
                    <SelectContent>
                      {voices.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col group", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className="flex items-start gap-2">
                {msg.role === 'ai' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100" onClick={() => handleSpeech(msg.text)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
                <div className={cn(msg.role === 'user' ? "chat-bubble-user" : "chat-bubble-ai")}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="chat-bubble-ai flex gap-1 animate-pulse">...</div>}
        </div>
      </ScrollArea>

      <div className="p-4 glass-morphism sticky bottom-0 z-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <UploadButton icon={<ImageIcon className="w-4 h-4" />} label="Photo" type="image/*" onUpload={(e) => handleFileUpload(e, 'image')} />
            <UploadButton icon={<FileText className="w-4 h-4" />} label="PDF" type="application/pdf" onUpload={(e) => handleFileUpload(e, 'document')} />
            <UploadButton icon={<CodeIcon className="w-4 h-4" />} label="Code" type="text/*" onUpload={(e) => handleFileUpload(e, 'code')} />
            <UploadButton icon={<Video className="w-4 h-4" />} label="Vidéo" type="video/*" onUpload={(e) => handleFileUpload(e, 'video')} />
          </div>

          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <Button type="button" variant={isListening ? "destructive" : "secondary"} size="icon" className={cn("h-12 w-12 rounded-full", isListening && "animate-pulse")} onClick={toggleListening}>
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            <div className="flex-1 relative">
              <Input placeholder="Votre message..." className="h-12 pr-12 rounded-full" value={inputText} onChange={(e) => setInputText(e.target.value)} />
              <Button type="submit" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-full bg-savigny-indigo" disabled={!inputText.trim() || isLoading}>
                <Send className="w-5 h-5 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function UploadButton({ icon, label, type, onUpload }: { icon: React.ReactNode, label: string, type: string, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input type="file" ref={inputRef} className="hidden" accept={type} onChange={onUpload} />
      <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs" onClick={() => inputRef.current?.click()}>
        {icon}{label}
      </Button>
    </>
  );
}
