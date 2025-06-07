
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, X } from 'lucide-react';
import { answerWeatherQuestion, AnswerWeatherQuestionInput } from '@/ai/flows/answer-weather-question';
import type { LocationInfo } from '@/types/weather';
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface WeatherAssistantProps {
  currentLocation: LocationInfo | null;
  onClose?: () => void;
  isOpen?: boolean;
}

const WeatherAssistant: React.FC<WeatherAssistantProps> = ({ currentLocation, onClose, isOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Add a small delay to ensure the input is visible and rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (!currentLocation || !currentLocation.name) {
      toast({
        title: "Location Needed",
        description: "Please select a location before asking the assistant.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiInput: AnswerWeatherQuestionInput = {
        question: userMessage.text,
        location: currentLocation.name,
      };
      const result = await answerWeatherQuestion(aiInput);
      const botMessage: Message = { id: (Date.now() + 1).toString(), text: result.answer, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't get an answer right now. Please try again.",
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
       toast({
        title: "Assistant Error",
        description: "Could not get a response from the weather assistant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus(); // Re-focus after submission
    }
  };

  return (
    <Card className="shadow-xl w-full flex flex-col h-[70vh] max-h-[600px] md:rounded-lg overflow-hidden bg-background/90 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Bot className="w-6 h-6 mr-2 text-primary" />
          <CardTitle className="text-lg font-semibold">Weather Assistant</CardTitle>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
            <span className="sr-only">Close Assistant</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground pt-4">Ask me anything about the weather in {currentLocation?.name || 'the selected location'}!</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end space-x-2 mb-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] p-3 rounded-xl shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-card-foreground rounded-bl-none border'
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                 <Avatar className="w-8 h-8">
                  <AvatarFallback><User size={18}/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end space-x-2 mb-4">
              <Avatar className="w-8 h-8">
                 <AvatarFallback><Bot size={18}/></AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground rounded-bl-none">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-background/50">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder={currentLocation ? `Ask about ${currentLocation.name}...` : "Select location first..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || !currentLocation}
            className="flex-grow bg-background focus:ring-accent"
            aria-label="Chat input"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim() || !currentLocation} className="bg-accent hover:bg-accent/90">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default WeatherAssistant;
