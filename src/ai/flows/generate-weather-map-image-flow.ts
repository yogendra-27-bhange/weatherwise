'use client';

import { useState, useEffect, FormEvent } from 'react';
import WeatherDashboard from '@/components/weather-dashboard';
import HourlyForecast from '@/components/hourly-forecast';
import ForecastView from '@/components/forecast-view';
import WeatherAssistant from '@/components/weather-assistant';
import OutfitAdvisor from '@/components/outfit-advisor';
import WeatherFactsCard from '@/components/weather-facts-card';
import WeatherNewsFeed from '@/components/weather-news-feed';
import WeatherAlerts from '@/components/weather-alerts';
// import MapPlaceholder from '@/components/map-placeholder'; Removed

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, CloudSun, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { getWeatherData, searchLocation } from '@/lib/weather-api';
import type { WeatherData, LocationInfo, UserPreferences } from '@/types/weather';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

export default function HomePage() {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedPrefsString = localStorage.getItem('weatherWisePreferences');
    let defaultLocationName: string | null = null;
    if (storedPrefsString) {
      const storedPrefs = JSON.parse(storedPrefsString) as UserPreferences;
      if (storedPrefs.defaultLocationName) {
        defaultLocationName = storedPrefs.defaultLocationName;
      }
    }

    if (defaultLocationName) {
      searchLocation(defaultLocationName).then(locInfo => {
        setCurrentLocation(locInfo);
        toast({
            title: "Default Location Loaded",
            description: `Showing weather for your default: ${locInfo.name}.`,
        });
      }).catch(() => {
        attemptGeolocation();
      });
    } else {
      attemptGeolocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const attemptGeolocation = () => {
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locInfo = await searchLocation(`${position.coords.latitude},${position.coords.longitude}`);
          setCurrentLocation(locInfo);
           toast({
            title: "Location Detected",
            description: `Showing weather for your current location: ${locInfo.name}.`,
          });
        },
        (error) => {
          console.warn("Error getting geolocation:", error.message);
          toast({
            title: "Geolocation Disabled",
            description: "Could not auto-detect location. Defaulting to London. You can set a default in Settings.",
            variant: "default",
          });
          searchLocation("London").then(setCurrentLocation);
        }
      );
    } else {
       toast({
        title: "Geolocation Not Supported",
        description: "Defaulting to London. You can set a default in Settings.",
      });
      searchLocation("London").then(setCurrentLocation);
    }
  };


  const handleSearch = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const locInfo = await searchLocation(searchQuery);
      if (locInfo.name.toLowerCase() === 'unknown city') {
        toast({
          title: "Location Not Found",
          description: `Could not find weather for "${searchQuery}". Please try another location.`,
          variant: "destructive",
        });
      } else {
        setCurrentLocation(locInfo);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for location.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (currentLocation && currentLocation.name) {
      setIsLoading(true);
      setWeatherData(null);
      getWeatherData(currentLocation)
        .then(data => {
          setWeatherData(data);
          if (!isLoading) {
            toast({
              title: "Weather Updated",
              description: `Showing weather for ${data.current.locationName}.`,
            });
          }
        })
        .catch(error => {
          console.error("Error fetching weather data:", error);
           toast({
            title: "Weather Data Error",
            description: `Could not fetch weather data for ${currentLocation.name}.`,
            variant: "destructive",
          });
          setWeatherData(null);
        })
        .finally(() => setIsLoading(false));
    } else if (!currentLocation && !isSearching){
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);

  const getPageBackgroundClass = () => {
    if (!weatherData) return 'bg-gradient-to-br from-sky-400 to-blue-600';
    const code = weatherData.current.conditionCode;
    if (code.startsWith('01')) return 'bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500'; // Clear
    if (code.startsWith('10') || code.startsWith('09')) return 'bg-gradient-to-br from-slate-400 via-gray-500 to-blue-gray-600'; // Rain
    if (code.startsWith('13')) return 'bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-400'; // Snow
    if (code.startsWith('11')) return 'bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-900'; // Thunderstorm
    if (code.startsWith('02') || code.startsWith('03') || code.startsWith('04')) return 'bg-gradient-to-br from-sky-300 via-cyan-400 to-teal-500'; // Clouds
    if (code.startsWith('50')) return 'bg-gradient-to-br from-gray-300 via-neutral-400 to-slate-500'; // Mist/Fog
    return 'bg-gradient-to-br from-sky-400 to-blue-600'; // Default
  };


  return (
    <div className={`flex flex-col items-center min-h-screen p-4 md:p-8 transition-colors duration-500 ${getPageBackgroundClass()}`}>
      <header className="w-full max-w-7xl mb-8">
        <Card className="shadow-xl bg-background/80 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <CloudSun className="w-10 h-10 text-primary mr-3" />
              <h1 className="text-4xl font-bold text-primary tracking-tight">WeatherWise</h1>
            </div>
            <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city..."
                className="flex-grow md:min-w-[300px] bg-background focus:ring-accent"
                aria-label="Search for a city"
              />
              <Button type="submit" disabled={isSearching} className="bg-accent hover:bg-accent/90">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span className="sr-only">Search</span>
              </Button>
            </form>
            <Button variant="ghost" size="icon" asChild aria-label="Open Settings">
                <Link href="/settings">
                    <SettingsIcon className="w-6 h-6 text-muted-foreground hover:text-accent" />
                </Link>
            </Button>
          </CardContent>
        </Card>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-1 space-y-6">
          <WeatherDashboard data={weatherData?.current ?? null} isLoading={isLoading && !weatherData} />
          <OutfitAdvisor weather={weatherData?.current ?? null} isLoading={isLoading && !weatherData} />
          <WeatherFactsCard />
        </section>

        <section className="lg:col-span-2 space-y-6">
          <HourlyForecast data={weatherData?.hourly ?? null} isLoading={isLoading && !weatherData} />
          <ForecastView data={weatherData?.daily ?? null} isLoading={isLoading && !weatherData} />
           {/* <MapPlaceholder currentLocation={currentLocation} /> Removed */}
        </section>

        <section className="lg:col-span-1 space-y-6">
           <WeatherNewsFeed currentLocation={currentLocation} />
        </section>

        <section className="lg:col-span-4 w-full mt-6">
           <WeatherAlerts weatherData={weatherData} isLoading={isLoading && !weatherData} />
        </section>
      </main>

      <footer className="w-full max-w-7xl mt-12 text-center">
        <p className="text-sm text-background/80">
          WeatherWise &copy; {new Date().getFullYear()}. Weather data by OpenWeatherMap. News by NewsAPI.org.
        </p>
         <p className="text-xs text-background/70 mt-1">
          Tip: Add WeatherWise to your Home Screen for a better experience! (Usually in browser menu)
        </p>
      </footer>

      {!isAssistantOpen && (
        <Button
          size="lg"
          className="fixed bottom-8 right-8 rounded-full shadow-xl p-4 h-16 w-16 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setIsAssistantOpen(true)}
          aria-label="Open Weather Assistant"
        >
          <MessageSquare size={32} />
        </Button>
      )}

      {isAssistantOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 z-50 w-full md:max-w-md lg:max-w-lg transition-all duration-300 ease-in-out">
           <WeatherAssistant
            currentLocation={currentLocation}
            onClose={() => setIsAssistantOpen(false)}
            isOpen={isAssistantOpen}
          />
        </div>
      )}
    </div>
  );
}