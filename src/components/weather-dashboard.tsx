
import type { CurrentWeatherData } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import WeatherIcon from './weather-icon';
import { Progress } from '@/components/ui/progress';
import { Thermometer, Wind, Droplets, Sun, Sunrise, Sunset, Leaf, AlertTriangle as AlertIcon } from 'lucide-react'; 

interface WeatherDashboardProps {
  data: CurrentWeatherData | null;
  isLoading: boolean;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ data, isLoading }) => {
  
  const getAqiHealthInfo = (aqi: number | undefined) => {
    if (aqi === undefined) return { label: 'N/A', color: 'text-muted-foreground', progressColor: 'bg-muted' };
    if (aqi <= 50) return { label: 'Good', color: 'text-green-500', progressColor: 'bg-green-500' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-500', progressColor: 'bg-yellow-500' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'text-orange-500', progressColor: 'bg-orange-500' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-500', progressColor: 'bg-red-500' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-500', progressColor: 'bg-purple-500' };
    return { label: 'Hazardous', color: 'text-red-700 dark:text-red-500', progressColor: 'bg-red-700' }; 
  };

  const getPollenLevelInfo = (pollenCount: number | undefined) => {
    // Assuming pollenCount is on a 0-5 scale for UI representation
    if (pollenCount === undefined) return { label: 'N/A', color: 'text-muted-foreground', progressPercent: 0 };
    if (pollenCount === 0) return { label: 'Very Low', color: 'text-green-500', progressPercent: 5 }; // Show a sliver for 0
    if (pollenCount === 1) return { label: 'Low', color: 'text-green-400', progressPercent: 20 };
    if (pollenCount === 2) return { label: 'Moderate', color: 'text-yellow-500', progressPercent: 40 };
    if (pollenCount === 3) return { label: 'High', color: 'text-orange-500', progressPercent: 60 };
    if (pollenCount === 4) return { label: 'Very High', color: 'text-red-500', progressPercent: 80 };
    if (pollenCount >= 5) return { label: 'Extreme', color: 'text-red-700 dark:text-red-500', progressPercent: 100 };
    return { label: 'N/A', color: 'text-muted-foreground', progressPercent: 0 };
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Loading weather...</CardTitle>
          <CardDescription>Fetching current conditions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="animate-pulse bg-muted rounded-lg p-4 h-24"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-24 col-span-2"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-16"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-16"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-16"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-16"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-16"></div>
          <div className="animate-pulse bg-muted rounded-lg p-4 h-16"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">No weather data</CardTitle>
          <CardDescription>Please select a location.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const aqiInfo = getAqiHealthInfo(data.aqi);
  const pollenInfo = getPollenLevelInfo(data.pollenCount);

  return (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary-foreground bg-primary -m-6 mb-0 p-6 rounded-t-lg flex items-center justify-between">
          <span>{data.locationName}</span>
          <WeatherIcon conditionCode={data.conditionCode} isDay={data.isDay} className="w-12 h-12" />
        </CardTitle>
        <CardDescription className="pt-4 text-lg">{data.description}</CardDescription>
        <p className="text-sm text-muted-foreground">{data.observationTime}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg shadow">
          <Thermometer className="w-10 h-10 text-accent mb-2" />
          <p className="text-4xl font-bold">{data.temp}°C</p>
          <p className="text-sm text-muted-foreground">Feels like {data.feelsLike}°C</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow">
            <Wind className="w-8 h-8 text-accent mb-1" />
            <p className="text-xl font-semibold">{data.windSpeed} km/h</p>
            <p className="text-xs text-muted-foreground">Wind</p>
            <Progress value={Math.min((data.windSpeed / 50) * 100, 100)} className="w-full h-1.5 mt-1" /> 
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow">
            <Droplets className="w-8 h-8 text-accent mb-1" />
            <p className="text-xl font-semibold">{data.humidity}%</p>
            <p className="text-xs text-muted-foreground">Humidity</p>
            <Progress value={data.humidity} className="w-full h-1.5 mt-1" />
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow">
            <Sun className="w-8 h-8 text-accent mb-1" />
            <p className="text-xl font-semibold">{data.uvIndex}</p>
            <p className="text-xs text-muted-foreground">UV Index</p>
             <Progress value={Math.min((data.uvIndex / 11) * 100, 100)} className="w-full h-1.5 mt-1" />
          </div>
           <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow">
             <Sunrise className="w-8 h-8 text-accent mb-1" />
             <p className="text-xl font-semibold">{data.sunrise}</p>
             <p className="text-xs text-muted-foreground">Sunrise</p>
           </div>
           <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow">
             <Sunset className="w-8 h-8 text-accent mb-1" />
             <p className="text-xl font-semibold">{data.sunset}</p>
             <p className="text-xs text-muted-foreground">Sunset</p>
           </div>
           <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow">
             <AlertIcon className={`w-8 h-8 mb-1 ${aqiInfo.color}`} />
             <p className={`text-xl font-semibold ${aqiInfo.color}`}>{data.aqi ?? 'N/A'}</p>
             <p className="text-xs text-muted-foreground">AQI: {aqiInfo.label}</p>
             <Progress value={data.aqi ? Math.min((data.aqi / 300) * 100, 100) : 0} className={`w-full h-1.5 mt-1 [&>div]:${aqiInfo.progressColor}`} />
           </div>
           <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-lg shadow md:col-span-1">
             <Leaf className={`w-8 h-8 mb-1 ${pollenInfo.color}`} />
             <p className={`text-xl font-semibold ${pollenInfo.color}`}>{pollenInfo.label}</p>
             <p className="text-xs text-muted-foreground">Pollen</p>
             <div className="w-full h-1.5 mt-1 bg-muted rounded-full">
                <div 
                    className={`h-full rounded-full transition-all duration-300 ${pollenInfo.color.startsWith('text-green') ? 'bg-green-500' : 
                                   pollenInfo.color.startsWith('text-yellow') ? 'bg-yellow-500' : 
                                   pollenInfo.color.startsWith('text-orange') ? 'bg-orange-500' : 
                                   pollenInfo.color.startsWith('text-red') ? 'bg-red-500' : 'bg-transparent'}`}
                    style={{width: `${pollenInfo.progressPercent}%`}}
                ></div>
             </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherDashboard;
