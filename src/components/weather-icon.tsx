
import type { LucideProps } from 'lucide-react';
import {
  Sun, Moon, CloudSun, CloudMoon, Cloud, Cloudy,
  CloudDrizzle, CloudRain, CloudLightning, CloudSnow,
  CloudFog, Wind, Umbrella, ThermometerSun, ThermometerSnowflake, Waves, Sunrise, Sunset, Leaf, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherIconProps extends Omit<LucideProps, 'name'> {
  conditionCode: string;
  isDay?: boolean;
  animated?: boolean;
  description?: string; // Added for better aria-label
}

const iconMap: Record<string, React.ElementType> = {
  // Day icons
  '01d': Sun, // clear sky
  '02d': CloudSun, // few clouds
  '03d': Cloud, // scattered clouds
  '04d': Cloudy, // broken clouds, overcast
  '09d': CloudDrizzle, // shower rain
  '10d': CloudRain, // rain
  '11d': CloudLightning, // thunderstorm
  '13d': CloudSnow, // snow
  '50d': CloudFog, // mist

  // Night icons
  '01n': Moon,
  '02n': CloudMoon,
  '03n': Cloud,
  '04n': Cloudy,
  '09n': CloudDrizzle,
  '10n': CloudRain,
  '11n': CloudLightning,
  '13n': CloudSnow,
  '50n': CloudFog,

  // Generic for simpler mapping if needed (description based)
  'Clear': Sun, 
  'Clouds': Cloud,
  'Drizzle': CloudDrizzle,
  'Rain': CloudRain,
  'Thunderstorm': CloudLightning,
  'Snow': CloudSnow,
  'Mist': CloudFog,
  'Fog': CloudFog,
  'Haze': CloudFog,
  
  // Specific UI icons
  'Wind': Wind,
  'Humidity': Waves,
  'UVIndex': ThermometerSun,
  'Sunrise': Sunrise,
  'Sunset': Sunset,
  'Hot': ThermometerSun,
  'Cold': ThermometerSnowflake,
  'Umbrella': Umbrella,
  'AQI': AlertTriangle,
  'Pollen': Leaf,
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ conditionCode, isDay = true, animated = false, className, description, ...props }) => {
  let IconComponent: React.ElementType | undefined;
  let resolvedDescription = description || conditionCode; // Use provided description or fallback to code

  // Try direct mapping first (e.g., for 'AQI', 'Pollen')
  if (iconMap[conditionCode]) {
    IconComponent = iconMap[conditionCode];
    // Adjust for day/night if it's a generic weather condition like 'Clear'
    if (conditionCode === 'Clear' && !isDay) IconComponent = Moon;
    if (conditionCode === 'Clouds' && isDay && (conditionCode.startsWith('02') || resolvedDescription.toLowerCase().includes("few clouds"))) IconComponent = CloudSun;
    if (conditionCode === 'Clouds' && !isDay && (conditionCode.startsWith('02') || resolvedDescription.toLowerCase().includes("few clouds"))) IconComponent = CloudMoon;
  } else {
    // Fallback for OpenWeatherMap-like codes (e.g., '01d', '10n')
    const baseCode = conditionCode.substring(0, 2);
    const dayNightSuffix = isDay ? 'd' : 'n';
    const specificCode = `${baseCode}${dayNightSuffix}`;
    
    IconComponent = iconMap[specificCode] || iconMap[baseCode+'d'] || Sun; // Default to Sun if nothing matches
    // Try to get a more specific description if we resolved through code parts
    if (!description && specificCode.startsWith(baseCode)) {
      // Attempt to map back to a textual description from the code
      if (baseCode === '01') resolvedDescription = 'Clear sky';
      else if (baseCode === '02') resolvedDescription = 'Few clouds';
      // ... add more mappings if needed
    }
  }
  
  let animationClass = '';
  if (animated) {
    const lowerDesc = resolvedDescription.toLowerCase();
    if (lowerDesc.includes('clear') || lowerDesc.includes('sun') || lowerDesc.includes('moon')) {
      animationClass = 'animate-weather-pulse';
    } else if (lowerDesc.includes('cloud')) {
      animationClass = 'animate-weather-sway';
    }
  }

  return <IconComponent className={cn(animationClass, className)} {...props} aria-label={resolvedDescription} />;
};

export default WeatherIcon;
