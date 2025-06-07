
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, Loader2, ImageOff } from 'lucide-react';
import type { LocationInfo } from '@/types/weather';
import { generateWeatherMapImage } from '@/ai/flows/generate-weather-map-image-flow';
import { Skeleton } from './ui/skeleton';

interface MapPlaceholderProps {
  currentLocation: LocationInfo | null;
}

const defaultMapImageUrl = "https://placehold.co/600x400.png/E2E8F0/A0AEC0?text=Weather+Map+View";
const errorMapImageUrl = "https://placehold.co/600x400.png/FFCDD2/B71C1C?text=Map+Error";

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ currentLocation }) => {
  const [mapImageUrl, setMapImageUrl] = useState<string>(defaultMapImageUrl);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (currentLocation && currentLocation.name && currentLocation.name !== "Unknown City" && currentLocation.name !== "Search Error") {
      setIsLoadingImage(true);
      setMapImageUrl(defaultMapImageUrl); // Reset to default while loading new one

      generateWeatherMapImage({ locationName: currentLocation.name })
        .then(response => {
          setMapImageUrl(response.imageUrl);
        })
        .catch(error => {
          console.error("Failed to generate map image:", error);
          setMapImageUrl(errorMapImageUrl);
        })
        .finally(() => {
          setIsLoadingImage(false);
        });
    } else {
      // If no location, or invalid location, reset to default generic placeholder
      setMapImageUrl(defaultMapImageUrl);
      setIsLoadingImage(false);
    }
  }, [currentLocation]);

  return (
    <Card className="shadow-md bg-background/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-primary" />
          Weather Map {currentLocation ? `for ${currentLocation.name}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
          {isLoadingImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading map preview...</p>
            </div>
          )}
          {!isLoadingImage && mapImageUrl === errorMapImageUrl && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 z-10">
              <ImageOff className="w-10 h-10 text-destructive mb-2" />
              <p className="text-sm text-destructive-foreground">Could not load map image.</p>
            </div>
          )}
          <Image
            src={mapImageUrl}
            alt={currentLocation ? `Weather map for ${currentLocation.name}` : "Placeholder for weather map"}
            width={600}
            height={400}
            className="object-cover w-full h-full"
            data-ai-hint={currentLocation ? `weather map satellite ${currentLocation.name}` : "weather map satellite"}
            key={mapImageUrl} // Add key to force re-render on src change, helps with Next/Image caching issues
            onError={() => {
              if (mapImageUrl !== errorMapImageUrl) setMapImageUrl(errorMapImageUrl); // Prevent infinite loop if error image itself fails
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isLoadingImage ? 'Generating map preview...' : 'Live map integration coming soon. (Static AI-generated preview)'}
        </p>
      </CardContent>
    </Card>
  );
};

export default MapPlaceholder;
