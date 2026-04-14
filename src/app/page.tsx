"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Settings, 
  Volume2, 
  Mic, 
  MicOff, 
  Paperclip, 
  Moon, 
  Sun, 
  Plus, 
  FileText, 
  Code as CodeIcon, 
  Music, 
  Image as ImageIcon, 
  Video,
  X,
  Smartphone
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
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  type?: 'text' | 'file';
};

export default function SavignyIAApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Bonjour ! Je suis Savigny IA. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  
  // Settings
  const [lienCerveau, setLienCerveau] = useState('');
  const [lienMedias, setLienMedias] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initial scroll
    scrollToBottom();

    // Theme setup
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');

    // Voice setup
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceName) {
        setSelectedVoiceName(availableVoices[0].name);
      }
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    // WebSpeech API setup
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

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
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
    scrollToBottom();
  }, [messages, isLoading]);

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
      let response;
      if (fromVoice) {
        response = await handsFreeVoiceChat({ transcript: text });
        handleResponse(response.aiResponse);
      } else {
        response = await aiTextChat({ message: text });
        handleResponse(response.response);
      }
    } catch (error) {
      console.error(error);
      handleResponse("Désolé, une erreur s'est produite lors de la connexion au cerveau.");
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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) utterance.voice = voice;
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
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
      
      const userFileMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: `Fichier envoyé: ${file.name}`,
        timestamp: new Date(),
        type: 'file'
      };
      setMessages(prev => [...prev, userFileMsg]);

      try {
        const result = await analyzeMultimodalContent({
          mediaDataUri: base64,
          mimeType: file.type,
          textPrompt: `Analyse cet élément (${type}) et réponds de manière concise.`
        });
        handleResponse(result.analysis);
      } catch (error) {
        console.error(error);
        handleResponse("Erreur lors de l'analyse du fichier.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-border z-10 glass-morphism sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-savigny-indigo flex items-center justify-center text-white font-bold shadow-lg shadow-savigny-indigo/20">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Savigny IA</h1>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> En ligne
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun className="w-5 h-5 text-savigny-cyan" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Configuration</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="brain">Lien Cerveau (API Chat)</Label>
                  <Input 
                    id="brain" 
                    placeholder="https://api.savigny.ia/v1" 
                    value={lienCerveau}
                    onChange={(e) => setLienCerveau(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media">Lien Médias (Facultatif)</Label>
                  <Input 
                    id="media" 
                    placeholder="https://cdn.savigny.ia/storage" 
                    value={lienMedias}
                    onChange={(e) => setLienMedias(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Voix du système</Label>
                  <Select value={selectedVoiceName} onValueChange={setSelectedVoiceName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une voix" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-start gap-2 max-w-full">
                {msg.role === 'ai' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleSpeech(msg.text)}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
                
                <div className={cn(
                  msg.role === 'user' ? "chat-bubble-user" : "chat-bubble-ai",
                  msg.type === 'file' ? "font-code bg-savigny-cyan/10 border border-savigny-cyan/20" : ""
                )}>
                  {msg.text}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start gap-1">
              <div className="chat-bubble-ai flex gap-1 items-center py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 glass-morphism sticky bottom-0 z-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {/* Action Row */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <UploadButton icon={<ImageIcon className="w-4 h-4" />} label="Photo" type="image/*" onUpload={(e) => handleFileUpload(e, 'image')} />
            <UploadButton icon={<FileText className="w-4 h-4" />} label="PDF" type="application/pdf" onUpload={(e) => handleFileUpload(e, 'document')} />
            <UploadButton icon={<CodeIcon className="w-4 h-4" />} label="Code" type="text/*" onUpload={(e) => handleFileUpload(e, 'code')} />
            <UploadButton icon={<Video className="w-4 h-4" />} label="Vidéo" type="video/*" onUpload={(e) => handleFileUpload(e, 'video')} />
            <UploadButton icon={<Music className="w-4 h-4" />} label="Audio" type="audio/*" onUpload={(e) => handleFileUpload(e, 'audio')} />
          </div>

          <form 
            className="flex items-center gap-2" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <Button 
              type="button" 
              variant={isListening ? "destructive" : "secondary"} 
              size="icon" 
              className={cn("h-12 w-12 rounded-full transition-all shrink-0", isListening && "animate-pulse")}
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            
            <div className="flex-1 relative">
              <Input
                placeholder="Votre message..."
                className="h-12 pr-12 rounded-full border-none bg-secondary focus-visible:ring-savigny-indigo"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1 h-10 w-10 rounded-full bg-savigny-indigo hover:bg-savigny-indigo/90"
                disabled={!inputText.trim() || isLoading}
              >
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
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept={type} 
        onChange={onUpload} 
      />
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full gap-2 border-border/50 shrink-0 bg-background/50 hover:bg-savigny-indigo/10 hover:border-savigny-indigo/30 transition-all text-xs"
        onClick={() => inputRef.current?.click()}
      >
        {icon}
        {label}
      </Button>
    </>
  );
}
