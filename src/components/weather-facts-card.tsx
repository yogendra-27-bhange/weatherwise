
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';

const weatherFacts = [
  "The highest temperature ever recorded on Earth was 56.7°C (134°F) in Death Valley, USA.",
  "Clouds can weigh over a million pounds!",
  "Snowflakes always have six sides.",
  "Lightning strikes the Earth about 100 times every second.",
  "The windiest place on Earth is Commonwealth Bay, Antarctica.",
  "Rain contains Vitamin B12.",
  "A rainbow is actually a full circle of light, but from the ground we only see part of it.",
  "Fog is essentially a cloud that is close to the ground.",
  "Hurricanes can release energy equivalent to 10,000 nuclear bombs.",
  "Some tornadoes can be faster than Formula One race cars.",
  "Weather forecasting has been practiced for thousands of years, but modern methods began in the 19th century.",
  "The Atacama Desert in Chile is the driest place on Earth, with some areas not seeing rain for centuries."
];

const WeatherFactsCard: React.FC = () => {
  const [currentFact, setCurrentFact] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pickRandomFact = () => {
    setIsLoading(true);
    // Simulate slight delay for a better UX when refreshing
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * weatherFacts.length);
      setCurrentFact(weatherFacts[randomIndex]);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    pickRandomFact();
  }, []);

  return (
    <Card className="shadow-md bg-background/70 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
          Weather Fact
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={pickRandomFact} aria-label="New fact">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && !currentFact ? (
          <>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </>
        ) : (
          <p className="text-sm text-muted-foreground min-h-[40px]">
            {currentFact || "Loading fact..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherFactsCard;
