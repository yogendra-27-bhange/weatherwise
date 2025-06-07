
import type { CurrentWeatherData, DailyForecastItem, HourlyForecastItem, LocationInfo, WeatherData, NewsItem } from '@/types/weather';
import { format, addHours, addDays, startOfHour, parseISO, setHours, setMinutes } from 'date-fns';

// Helper to simulate API delay (only for mocks)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// --- Mock Data Generation (Fallback) ---
const mockConditionCodes = ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d', '50d'];
const mockDescriptions: Record<string, string> = {
  '01': 'Clear Sky', '02': 'Few Clouds', '03': 'Scattered Clouds', '04': 'Broken Clouds',
  '09': 'Shower Rain', '10': 'Rain', '11': 'Thunderstorm', '13': 'Snow', '50': 'Mist'
};
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getIsDayMock = (date: Date = new Date()): boolean => {
  const hour = date.getHours();
  return hour >= 6 && hour < 18;
};
const generateMockCurrentWeather = (location: LocationInfo): CurrentWeatherData => {
  const now = new Date();
  const isDay = getIsDayMock(now);
  const baseCode = getRandomElement(mockConditionCodes).substring(0, 2);
  const conditionCode = `${baseCode}${isDay ? 'd' : 'n'}`;
  const sunriseTime = setMinutes(setHours(now, 6), Math.floor(Math.random() * 30) + 15);
  const sunsetTime = setMinutes(setHours(now, 18), Math.floor(Math.random() * 30) + 30);
  return {
    temp: Math.floor(Math.random() * 25) + 5,
    feelsLike: Math.floor(Math.random() * 25) + 3,
    humidity: Math.floor(Math.random() * 70) + 30,
    windSpeed: Math.floor(Math.random() * 30) + 5,
    uvIndex: Math.floor(Math.random() * 11),
    description: mockDescriptions[baseCode] || 'Clear Sky',
    conditionCode: conditionCode,
    locationName: location.name,
    observationTime: format(now, "h:mm a, EEEE, MMMM d"),
    isDay: isDay,
    sunrise: format(sunriseTime, "h:mm a"),
    sunset: format(sunsetTime, "h:mm a"),
    aqi: Math.floor(Math.random() * 150) + 10,
    pollenCount: Math.floor(Math.random() * 5),
  };
};
const generateMockHourlyForecast = (): HourlyForecastItem[] => {
  const items: HourlyForecastItem[] = [];
  let currentTime = startOfHour(new Date());
  for (let i = 0; i < 24; i++) {
    const forecastTime = addHours(currentTime, i);
    const isDay = getIsDayMock(forecastTime);
    const baseCode = getRandomElement(mockConditionCodes).substring(0, 2);
    items.push({
      time: format(forecastTime, 'ha'),
      temp: Math.floor(Math.random() * 20) + 5,
      conditionCode: `${baseCode}${isDay ? 'd' : 'n'}`,
      isDay: isDay,
    });
  }
  return items;
};
const generateMockDailyForecast = (): DailyForecastItem[] => {
  const items: DailyForecastItem[] = [];
  let currentDate = new Date();
  for (let i = 0; i < 7; i++) { // Typically 7-day forecast
    const forecastDate = addDays(currentDate, i);
    const highTemp = Math.floor(Math.random() * 15) + 10;
    const baseCode = getRandomElement(mockConditionCodes).substring(0, 2);
    items.push({
      date: format(forecastDate, 'EEE, MMM d'),
      dayName: format(forecastDate, 'EEEE'),
      shortDate: format(forecastDate, 'M/d'),
      highTemp: highTemp,
      lowTemp: highTemp - (Math.floor(Math.random() * 5) + 3),
      conditionCode: `${baseCode}d`, // Daily usually depicted with day icon
      description: mockDescriptions[baseCode] || 'Clear Sky',
    });
  }
  return items;
};
// --- End of Mock Data Generation ---

export const getWeatherData = async (location: LocationInfo): Promise<WeatherData> => {
  if (!OPENWEATHERMAP_API_KEY || OPENWEATHERMAP_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY_HERE' || !location.lat || !location.lon) {
    console.warn("OpenWeatherMap API key not found, is a placeholder, or location lat/lon missing. Falling back to mock weather data.");
    await delay(500);
    if (location.name.toLowerCase() === 'error') {
      throw new Error("Mock API error: Could not fetch weather for 'error'.");
    }
    return {
      current: generateMockCurrentWeather(location),
      hourly: generateMockHourlyForecast(),
      daily: generateMockDailyForecast().slice(0, 5), // Dashboard shows 5-day
    };
  }

  try {
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lon}&exclude=minutely&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenWeatherMap API Error:", errorData);
      throw new Error(`Weather API error: ${response.statusText} - ${errorData.message}`);
    }
    const apiData = await response.json();

    let aqiValue: number | undefined = undefined;
    try {
        const aqiApiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${OPENWEATHERMAP_API_KEY}`;
        const aqiResponse = await fetch(aqiApiUrl);
        if (aqiResponse.ok) {
            const aqiData = await aqiResponse.json();
            if (aqiData.list && aqiData.list.length > 0) {
                const owmAqi = aqiData.list[0].main.aqi;
                // Standard AQI conversion: 1=Good (0-50), 2=Fair (51-100), 3=Moderate (101-150), 4=Poor (151-200), 5=Very Poor (201-300)
                // Let's use a simple mapping for display, aiming for a 0-300+ scale roughly
                const aqiMapping: {[key: number]: number} = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 }; // Mid-points of general categories
                aqiValue = aqiMapping[owmAqi] || owmAqi * 50; // Fallback if unexpected value
            }
        } else {
             console.warn(`AQI API Error: ${aqiResponse.statusText}`);
        }
    } catch (aqiError) {
        console.warn("Could not fetch AQI data:", aqiError);
    }

    const transformedData: WeatherData = {
      current: {
        temp: Math.round(apiData.current.temp),
        feelsLike: Math.round(apiData.current.feels_like),
        humidity: apiData.current.humidity,
        windSpeed: Math.round(apiData.current.wind_speed * 3.6), // m/s to km/h
        uvIndex: Math.round(apiData.current.uvi),
        description: apiData.current.weather[0].description.replace(/\b\w/g, (l: string) => l.toUpperCase()),
        conditionCode: apiData.current.weather[0].icon,
        locationName: location.name,
        observationTime: format(new Date(apiData.current.dt * 1000), "h:mm a, EEEE, MMMM d"),
        isDay: apiData.current.weather[0].icon.includes('d'),
        sunrise: format(new Date(apiData.current.sunrise * 1000), "h:mm a"),
        sunset: format(new Date(apiData.current.sunset * 1000), "h:mm a"),
        aqi: aqiValue,
        pollenCount: undefined, // Pollen data not standard from OpenWeatherMap OneCall
      },
      hourly: apiData.hourly.slice(0, 24).map((hour: any) => ({
        time: format(new Date(hour.dt * 1000), 'ha'),
        temp: Math.round(hour.temp),
        conditionCode: hour.weather[0].icon,
        isDay: hour.weather[0].icon.includes('d'),
      })),
      daily: apiData.daily.slice(0, 7).map((day: any) => ({
        date: format(new Date(day.dt * 1000), 'EEE, MMM d'),
        dayName: format(new Date(day.dt * 1000), 'EEEE'),
        shortDate: format(new Date(day.dt * 1000), 'M/d'),
        highTemp: Math.round(day.temp.max),
        lowTemp: Math.round(day.temp.min),
        conditionCode: day.weather[0].icon,
        description: day.weather[0].description.replace(/\b\w/g, (l: string) => l.toUpperCase()),
      })),
    };
    return transformedData;
  } catch (error) {
    console.error("Failed to fetch or transform real weather data:", error);
    console.warn("Falling back to mock weather data due to an error.");
    // Ensure mock data includes a name if location.name is available
    const mockLoc = location.name ? location : { name: "Unknown Location" };
    return {
      current: generateMockCurrentWeather(mockLoc),
      hourly: generateMockHourlyForecast(),
      daily: generateMockDailyForecast().slice(0, 5),
    };
  }
};

export const searchLocation = async (query: string): Promise<LocationInfo> => {
  if (!OPENWEATHERMAP_API_KEY || OPENWEATHERMAP_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
    console.warn("OpenWeatherMap API key not found or is placeholder for geocoding. Falling back to mock search.");
    await delay(300);
    if (query.toLowerCase() === 'unknown') return { name: "Unknown City" };
    const parts = query.split(',');
    const isCoordinates = parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
    if (isCoordinates) {
      return {
        name: "My Current Location", // Default name for coordinates
        lat: parseFloat(parts[0]),
        lon: parseFloat(parts[1])
      };
    }
    return {
      name: query.trim().replace(/\b\w/g, l => l.toUpperCase()),
      lat: parseFloat((Math.random() * 180 - 90).toFixed(4)),
      lon: parseFloat((Math.random() * 360 - 180).toFixed(4))
    };
  }

  const parts = query.split(',');
  const isCoordinates = parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));

  try {
    let geoApiUrl;
    if (isCoordinates) {
      geoApiUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${parts[0]}&lon=${parts[1]}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`;
      const response = await fetch(geoApiUrl);
      if (!response.ok) {
         const errorData = await response.json();
         console.error("OpenWeatherMap Reverse Geocoding API Error:", errorData);
         throw new Error(`Reverse Geocoding API error: ${response.statusText} - ${errorData.message || 'Failed to fetch location name'}`);
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const loc = data[0];
        const name = loc.name || "My Current Location";
        const state = loc.state || '';
        const country = loc.country || '';
        const detailedName = [name, state, country].filter(Boolean).join(', ');
        return { name: detailedName || "My Current Location", lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
      } else {
        // If reverse geocoding returns empty, still return a name for the coordinates
        return { name: "My Current Location", lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
      }
    } else { // City name search
      geoApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`;
      const response = await fetch(geoApiUrl);
       if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenWeatherMap Direct Geocoding API Error:", errorData);
        throw new Error(`Direct Geocoding API error: ${response.statusText} - ${errorData.message || 'City not found'}`);
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const loc = data[0];
        const name = loc.name;
        const state = loc.state || '';
        const country = loc.country || '';
        const detailedName = [name, state, country].filter(Boolean).join(', ');
        return { name: detailedName || loc.name, lat: loc.lat, lon: loc.lon };
      } else {
        return { name: "Unknown City" }; // City name not found
      }
    }
  } catch (error) {
    console.error("Failed to search location with API:", error);
    if (isCoordinates) return { name: "My Current Location", lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
    return { name: query.trim().replace(/\b\w/g, l => l.toUpperCase()) || "Search Error" }; // Fallback for other errors
  }
};

// Mock news data used as fallback for NewsAPI.org if key is missing
const getMockNewsArticles = async (keywords: string[], locationName?: string): Promise<NewsItem[]> => {
  await delay(700);
  const mockArticles: NewsItem[] = [
    {
      id: 'mock-article-1',
      type: 'article',
      title: `Local Weather Patterns Shifting in ${locationName || 'Region'}, Experts Say`,
      source: 'Mock Local News',
      url: '#mock-local-weather',
      rawPublishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      publishedAt: format(addDays(new Date(), -1), "MMM d, yyyy"),
      description: `Experts in ${locationName || 'the region'} discuss recent changes in weather patterns and their potential impact. This is mock data.`,
      imageUrl: `https://placehold.co/300x200.png/FFA07A/FFFFFF?text=Local+Weather`,
    },
    {
      id: 'mock-article-2',
      type: 'article',
      title: 'Upcoming Heatwave Advisory Issued for Many Areas (Mock Data)',
      source: 'Global Climate Watch (Mock)',
      url: '#mock-heatwave',
      rawPublishedAt: new Date().toISOString(),
      publishedAt: format(new Date(), "MMM d, yyyy"),
      description: 'A significant heatwave is expected to affect multiple regions in the coming days. This is mock data, please add a NewsAPI key.',
      imageUrl: 'https://placehold.co/300x200.png/FFD700/000000?text=Heatwave+Advisory',
    },
  ];
  return mockArticles.slice(0, 2); // Return a few mock articles
};

// Fetches videos from YouTube Data API
const getYouTubeNewsVideos = async (keywords: string[], locationName?: string): Promise<NewsItem[]> => {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    console.warn("YouTube API key not found or is a placeholder. No videos will be fetched.");
    return [];
  }

  try {
    let queryParts = [...keywords.slice(0,3), "news report"]; // Limit keywords for broader search
    if (locationName && locationName.toLowerCase() !== "my current location" && locationName.toLowerCase() !== "unknown city" && locationName.toLowerCase() !== "search error") {
      queryParts.push(locationName);
    }
    const searchQuery = queryParts.join(' '); // Simpler query for YouTube
    
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=3&order=relevance&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData.error?.message || response.statusText);
      return [];
    }
    const apiData = await response.json();

    if (apiData.items && apiData.items.length > 0) {
      return apiData.items.map((item: any): NewsItem => ({
        id: item.id.videoId,
        type: 'video',
        title: item.snippet.title,
        source: item.snippet.channelTitle || "YouTube",
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        videoId: item.id.videoId,
        rawPublishedAt: item.snippet.publishedAt, // Original ISO string
        publishedAt: item.snippet.publishedAt ? format(parseISO(item.snippet.publishedAt), "MMM d, yyyy") : "N/A",
        description: item.snippet.description || "No description available.",
        imageUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch YouTube videos:", error);
    return [];
  }
};


// Fetches news articles from NewsAPI.org and videos from YouTube
export const getNews = async (keywords: string[], locationName?: string): Promise<NewsItem[]> => {
  let articles: NewsItem[] = [];
  let videos: NewsItem[] = [];

  // Fetch articles from NewsAPI.org
  if (!NEWSAPI_API_KEY || NEWSAPI_API_KEY === 'YOUR_NEWSAPI_API_KEY_HERE') {
    console.warn("NewsAPI key not found or is a placeholder. Falling back to mock news articles.");
    articles = await getMockNewsArticles(keywords, locationName);
  } else {
    try {
      let queryParts: string[] = [...keywords];
      if (locationName && locationName.toLowerCase() !== "my current location" && locationName.toLowerCase() !== "unknown city" && locationName.toLowerCase() !== "search error") {
        queryParts.push(locationName);
         try {
            const locDetails = await searchLocation(locationName); 
            if(locDetails && locDetails.name !== "Unknown City" && locDetails.name !== "Search Error"){
                const countryOrState = locDetails.name.split(',').pop()?.trim();
                if(countryOrState && countryOrState.length > 2) queryParts.push(countryOrState); // Add broader location context
            }
          } catch (e) { /* ignore error in enriching location for news */ }
      }
      const finalQuery = queryParts.map(k => `"${k}"`).join(' OR ');
      
      const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(finalQuery)}&language=en&sortBy=relevancy&pageSize=3&apiKey=${NEWSAPI_API_KEY}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("NewsAPI Error:", errorData.message || response.statusText);
        articles = await getMockNewsArticles(keywords, locationName); 
      } else {
        const apiData = await response.json();
        if (apiData.articles && apiData.articles.length > 0) {
          articles = apiData.articles.map((article: any, index: number): NewsItem => ({
            id: article.url || `news-${index}-${Date.now()}`,
            type: 'article',
            title: article.title,
            source: article.source.name || "Unknown Source",
            url: article.url,
            rawPublishedAt: article.publishedAt, // Original ISO string
            publishedAt: article.publishedAt ? format(parseISO(article.publishedAt), "MMM d, yyyy") : "N/A",
            description: article.description || "No description available.",
            imageUrl: article.urlToImage,
          }));
        } else {
           articles = await getMockNewsArticles(keywords, locationName); 
        }
      }
    } catch (error) {
      console.error("Failed to fetch real news articles:", error);
      articles = await getMockNewsArticles(keywords, locationName); 
    }
  }

  // Fetch videos from YouTube
  videos = await getYouTubeNewsVideos(keywords, locationName);

  // Combine and sort by published date (newest first), with a preference for videos if dates are similar
  const combinedNews = [...videos, ...articles];
  combinedNews.sort((a, b) => {
    let timeA = 0;
    if (a.rawPublishedAt && a.rawPublishedAt !== "N/A") {
      try {
        timeA = parseISO(a.rawPublishedAt).getTime();
      } catch (e) { 
        // console.warn("Failed to parse date for sorting (item A):", a.rawPublishedAt, a.title);
      }
    }

    let timeB = 0;
    if (b.rawPublishedAt && b.rawPublishedAt !== "N/A") {
      try {
        timeB = parseISO(b.rawPublishedAt).getTime();
      } catch (e) {
        // console.warn("Failed to parse date for sorting (item B):", b.rawPublishedAt, b.title);
      }
    }
    
    if (timeB !== timeA) return timeB - timeA; // Newest first
    if (a.type === 'video' && b.type !== 'video') return -1; // Videos first if same date
    if (b.type === 'video' && a.type !== 'video') return 1;
    return 0;
  });
  
  return combinedNews.slice(0, 5); // Return combined top 5 items
};


export interface LocationInfoWithDetails extends LocationInfo {
    country?: string;
    state?: string;
}

