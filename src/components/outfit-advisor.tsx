
'use client';

import { useState, useEffect } from 'react';
import type { CurrentWeatherData } from '@/types/weather';
import { adviseOutfit, AdviseOutfitInput } from '@/ai/flows/advise-outfit-flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shirt, Umbrella, Snowflake, VenetianMask, Loader2, Lightbulb } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useToast } from "@/hooks/use-toast";

interface OutfitAdvisorProps {
  weather: CurrentWeatherData | null;
  isLoading: boolean; // This is for the parent component's weather data loading
}

const OutfitAdvisor: React.FC<OutfitAdvisorProps> = ({ weather, isLoading: isWeatherLoading }) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isAISuggestionLoading, setIsAISuggestionLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (weather && !isWeatherLoading) {
      setIsAISuggestionLoading(true);
      setSuggestion(null); // Clear previous suggestion

      const input: AdviseOutfitInput = {
        temp: weather.temp,
        description: weather.description,
        conditionCode: weather.conditionCode,
        isDay: weather.isDay,
        uvIndex: weather.uvIndex,
        windSpeed: weather.windSpeed,
      };

      adviseOutfit(input)
        .then(response => {
          setSuggestion(response.suggestion);
        })
        .catch(error => {
          console.error("OutfitAdvisor AI error:", error);
          setSuggestion("Could not get an AI suggestion. Dress appropriately for the weather!");
          toast({
            title: "Outfit Suggestion Error",
            description: "Failed to get an AI-powered outfit suggestion. Using a default message.",
            variant: "destructive",
            duration: 4000,
          });
        })
        .finally(() => {
          setIsAISuggestionLoading(false);
        });
    } else if (!weather && !isWeatherLoading) {
      setSuggestion("Weather data not available for suggestions.");
      setIsAISuggestionLoading(false);
    }
  }, [weather, isWeatherLoading, toast]);

  const getIconForSuggestion = () => {
    if (!suggestion && (isWeatherLoading || isAISuggestionLoading)) return Loader2; // Fallback if suggestion is null while AI loading
    if (!suggestion || !weather) return VenetianMask;

    const lowerSuggestion = suggestion.toLowerCase();
    if (lowerSuggestion.includes('umbrella') || lowerSuggestion.includes('rain')) return Umbrella;
    if (lowerSuggestion.includes('snow') || lowerSuggestion.includes('heavy jacket') || lowerSuggestion.includes('bundle up') || lowerSuggestion.includes('layers') || weather.temp < 5) return Snowflake;
    if (lowerSuggestion.includes('light clothes') || lowerSuggestion.includes('sunglasses') || weather.temp > 25) return Shirt;
    return Lightbulb; // Default to Lightbulb for general advice
  };
  
  const IconComponent = getIconForSuggestion();

  if (isWeatherLoading && !weather) { // Only show full card skeleton if weather data is truly loading for the first time
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Outfit & Activity Tip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-10/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md bg-background/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Outfit & Activity Tip</CardTitle>
      </CardHeader>
      <CardContent className="flex items-start space-x-3 min-h-[60px]">
        {isAISuggestionLoading ? (
          <Loader2 className="w-10 h-10 text-accent flex-shrink-0 animate-spin" />
        ) : (
          <IconComponent className="w-10 h-10 text-accent flex-shrink-0" />
        )}
        <p className="text-sm">
          {isAISuggestionLoading ? "Getting tailored advice..." : suggestion || "Awaiting weather data..."}
        </p>
      </CardContent>
    </Card>
  );
};

export default OutfitAdvisor;
