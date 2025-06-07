import type { HourlyForecastItem } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeatherIcon from './weather-icon';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface HourlyForecastProps {
  data: HourlyForecastItem[] | null;
  isLoading: boolean;
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Hourly Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse bg-muted rounded-lg p-4 flex-shrink-0 w-24 h-36"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Hourly Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No hourly data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Next 24 Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-4 pb-4">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center p-3 border rounded-lg shadow-sm bg-background/50 w-28 flex-shrink-0">
                <p className="text-sm font-medium">{item.time}</p>
                <WeatherIcon 
                  conditionCode={item.conditionCode} 
                  isDay={item.isDay} 
                  className="w-10 h-10 my-2 text-accent" 
                  animated 
                />
                <p className="text-lg font-bold">{item.temp}°C</p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HourlyForecast;
