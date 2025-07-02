import type { CurrentWeatherData, DailyForecastItem, HourlyForecastItem, LocationInfo, WeatherData, NewsItem } from '@/types/weather';
import { format, addHours, addDays, startOfHour, parseISO, setHours, setMinutes } from 'date-fns';

// Helper to simulate API delay (only for mocks)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// --- MET Norway (Yr.no) API Integration ---
export const getWeatherData = async (location: LocationInfo): Promise<WeatherData> => {
  if (!location.lat || !location.lon) {
    throw new Error('Location latitude and longitude are required.');
  }

  // MET Norway API endpoint
  const apiUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${location.lat}&lon=${location.lon}`;

  // Required User-Agent header as per MET Norway API policy
  const headers = {
    'User-Agent': 'weatherwise-app/1.0 github.com/yourusername/weatherwise',
    'Accept': 'application/json',
  };

  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`Yr.no API error: ${response.statusText}`);
  }
  const apiData = await response.json();

  // Helper to find the closest time index
  const now = new Date();
  const timeseries = apiData.properties.timeseries;
  const findClosestIndex = (targetDate: Date) => {
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < timeseries.length; i++) {
      const tsDate = new Date(timeseries[i].time);
      const diff = Math.abs(tsDate.getTime() - targetDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return closestIdx;
  };

  // Current weather (closest to now)
  const currentIdx = findClosestIndex(now);
  const currentData = timeseries[currentIdx];
  const instant = currentData.data.instant.details;
  const next1h = currentData.data.next_1_hours?.summary?.symbol_code || 'clearsky_day';
  const sunrise = '';
  const sunset = '';

  // Hourly forecast (next 24 hours)
  const hourly: HourlyForecastItem[] = timeseries.slice(currentIdx, currentIdx + 24).map(ts => {
    const details = ts.data.instant.details;
    const symbol = ts.data.next_1_hours?.summary?.symbol_code || 'clearsky_day';
    const tsDate = new Date(ts.time);
    return {
      time: format(tsDate, 'ha'),
      temp: Math.round(details.air_temperature),
      conditionCode: symbol,
      isDay: symbol.includes('day'),
    };
  });

  // Daily forecast (next 7 days)
  // Group by date, take max/min temp and most frequent symbol
  const dailyMap: Record<string, { temps: number[]; symbols: string[]; date: Date } > = {};
  for (let ts of timeseries) {
    const tsDate = new Date(ts.time);
    const dayKey = format(tsDate, 'yyyy-MM-dd');
    if (!dailyMap[dayKey]) {
      dailyMap[dayKey] = { temps: [], symbols: [], date: tsDate };
    }
    if (ts.data.instant.details?.air_temperature !== undefined) {
      dailyMap[dayKey].temps.push(ts.data.instant.details.air_temperature);
    }
    if (ts.data.next_1_hours?.summary?.symbol_code) {
      dailyMap[dayKey].symbols.push(ts.data.next_1_hours.summary.symbol_code);
    }
  }
  const daily: DailyForecastItem[] = Object.values(dailyMap).slice(0, 7).map(day => {
    const highTemp = Math.round(Math.max(...day.temps));
    const lowTemp = Math.round(Math.min(...day.temps));
    // Most frequent symbol
    const symbolCounts: Record<string, number> = {};
    for (let s of day.symbols) symbolCounts[s] = (symbolCounts[s] || 0) + 1;
    const conditionCode = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'clearsky_day';
    return {
      date: format(day.date, 'EEE, MMM d'),
      dayName: format(day.date, 'EEEE'),
      shortDate: format(day.date, 'M/d'),
      highTemp,
      lowTemp,
      conditionCode,
      description: conditionCode.replace(/_/g, ' '),
    };
  });

  // Compose current weather
  const current: CurrentWeatherData = {
    temp: Math.round(instant.air_temperature),
    feelsLike: Math.round(instant.air_temperature), // MET Norway does not provide feels like
    humidity: Math.round(instant.relative_humidity ?? 0),
    windSpeed: Math.round(instant.wind_speed ?? 0),
    uvIndex: Math.round(instant.ultraviolet_index_clear_sky ?? 0),
    description: next1h.replace(/_/g, ' '),
    conditionCode: next1h,
    locationName: location.name,
    observationTime: format(new Date(currentData.time), "h:mm a, EEEE, MMMM d"),
    isDay: next1h.includes('day'),
    sunrise,
    sunset,
    aqi: undefined,
    pollenCount: undefined,
  };

  return {
    current,
    hourly,
    daily,
  };
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

