
'use client';

import { useState, useEffect } from 'react';
import type { NewsItem, LocationInfo } from '@/types/weather';
import { getNews } from '@/lib/weather-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Newspaper, ExternalLink, Youtube, PlayCircle, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { useToast } from "@/hooks/use-toast";

const ICON_PLACEHOLDER_URL = 'USE_ICON_PLACEHOLDER';
const ERROR_IMAGE_URL = 'https://placehold.co/80x60.png/FFCDD2/B71C1C?text=LoadErr';

interface WeatherNewsFeedProps {
  currentLocation: LocationInfo | null;
}

const WeatherNewsFeed: React.FC<WeatherNewsFeedProps> = ({ currentLocation }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNewsAndVideos = async () => {
      setIsLoading(true);
      setNewsItems([]);
      try {
        // Keywords for news search
        const keywords = ["weather", "climate", "rain", "cyclone", "heatwave", "storm", "monsoon", "flood", "temperature", "environment", "climate change", "global warming"];
        
        // getNews will return a mix of articles (from NewsAPI if key present) 
        // and mock videos (if NewsAPI key is missing, or in future if YouTube API is added)
        const items = await getNews(keywords, currentLocation?.name);
        
        // Filter out items that don't have a title or a URL (for articles) or videoId (for videos)
        const validItems = items.filter(item => 
            item.title && 
            ((item.type === 'article' && item.url) || (item.type === 'video' && item.videoId))
        );

        setNewsItems(validItems);
        
      } catch (error) {
        console.error("Failed to fetch news/videos:", error);
        toast({
          title: "News Feed Error",
          description: "Could not fetch news and videos.",
          variant: "destructive",
        });
        setNewsItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewsAndVideos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);


  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-primary" /> Weather News & Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <Skeleton className="h-20 w-32 rounded" /> {/* Larger skeleton for potential video embed */}
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (newsItems.length === 0 && !isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-primary" /> Weather News & Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>No relevant news or videos available for {currentLocation?.name || 'this area'} at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md bg-background/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Newspaper className="w-5 h-5 mr-2 text-primary" /> Weather News & Videos {currentLocation?.name && `for ${currentLocation.name}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3"> {/* Increased height for videos */}
          <ul className="space-y-4">
            {newsItems.map((item) => (
              <li key={item.id} className="pb-4 border-b border-border last:border-b-0">
                <h3 className="font-medium text-sm leading-tight mb-1.5">{item.title}</h3>
                
                {item.type === 'video' && item.videoId ? (
                  <div className="aspect-video w-full rounded-md overflow-hidden my-2 shadow">
                    <iframe
                      src={`https://www.youtube.com/embed/${item.videoId}`}
                      title={item.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                ) : (
                  item.imageUrl && item.imageUrl !== ICON_PLACEHOLDER_URL && (
                     <div className="my-2 rounded-md overflow-hidden shadow">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={400} // Larger image for articles
                          height={225}
                          className="object-cover w-full h-auto"
                           onError={(e) => { e.currentTarget.src = ERROR_IMAGE_URL; }}
                        />
                     </div>
                  )
                )}
                
                <p className="text-xs text-muted-foreground mb-1.5">
                  {item.source} - {item.publishedAt} 
                  {item.type === 'video' && <Youtube className="inline w-3.5 h-3.5 ml-1.5 text-red-600" />}
                </p>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>

                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="p-0 h-auto text-xs"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.type === 'video' ? 'Watch on YouTube' : 'Read more'}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WeatherNewsFeed;
