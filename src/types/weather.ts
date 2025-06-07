
export interface CurrentWeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  description: string;
  conditionCode: string; // For icon mapping
  locationName: string;
  observationTime: string; // ISO string or formatted
  isDay: boolean;
  sunrise: string; // e.g., "6:30 AM"
  sunset: string; // e.g., "7:45 PM"
  aqi?: number; // Air Quality Index
  pollenCount?: number; // Pollen Count (e.g., 0-5 scale or actual count)
}

export interface HourlyForecastItem {
  time: string; // e.g., "3 PM" or "15:00"
  temp: number;
  conditionCode: string;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string; // e.g., "Mon, Sep 16"
  dayName: string; // e.g., "Monday"
  shortDate: string; // e.g., "9/16"
  highTemp: number;
  lowTemp: number;
  conditionCode: string;
  description: string;
}

export interface WeatherData {
  current: CurrentWeatherData;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface LocationInfo {
  name: string;
  lat?: number;
  lon?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string; // For articles, this is the article URL. For videos, it could be the YouTube page URL.
  rawPublishedAt?: string; // Original ISO date string for sorting
  publishedAt: string; // Formatted string for display
  description: string;
  imageUrl?: string; // Optional image URL for articles, or video thumbnail
  dataAiHint?: string; // Hint for AI image generation (less relevant for videos)
  type: 'article' | 'video'; // To distinguish between article and video
  videoId?: string; // YouTube video ID if type is 'video'
}

export interface WeatherAlertPreference {
  id: string;
  label: string;
  key: 'rainTomorrow' | 'tempAbove35' | 'tempBelow5';
  type: 'boolean' | 'number_gt' | 'number_lt'; // gt for greater than, lt for less than
  threshold?: number; // for temperature alerts
  enabled: boolean;
}

export interface UserPreferences {
  defaultLocationName?: string;
  themeColor?: string; // e.g., 'blue', 'green'
  // alertPreferences are managed separately or could be part of a larger user object
}

