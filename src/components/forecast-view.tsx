import type { DailyForecastItem } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import WeatherIcon from './weather-icon';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, LabelList } from 'recharts';
import { useMemo } from 'react';

interface ForecastViewProps {
  data: DailyForecastItem[] | null;
  isLoading: boolean;
}

const ForecastView: React.FC<ForecastViewProps> = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(item => ({
      name: item.shortDate,
      dayName: item.dayName,
      highTemp: item.highTemp,
      lowTemp: item.lowTemp,
      conditionCode: item.conditionCode,
      description: item.description,
    }));
  }, [data]);

  const { hottestDay, coldestDay } = useMemo(() => {
    if (!data || data.length === 0) return { hottestDay: null, coldestDay: null };
    let hottest = data[0];
    let coldest = data[0];
    data.forEach(day => {
      if (day.highTemp > hottest.highTemp) hottest = day;
      if (day.lowTemp < coldest.lowTemp) coldest = day;
    });
    return { hottestDay: hottest, coldestDay: coldest };
  }, [data]);

  if (isLoading) {
     return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse bg-muted rounded-lg h-[300px] w-full"></div>
           <div className="flex justify-between mt-4">
            <div className="animate-pulse bg-muted rounded-lg h-12 w-1/3"></div>
            <div className="animate-pulse bg-muted rounded-lg h-12 w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No 5-day forecast data available.</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    highTemp: { label: "High", color: "hsl(var(--chart-1))" },
    lowTemp: { label: "Low", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">5-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tickFormatter={(value, index) => chartData[index]?.dayName.substring(0,3) || value}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} unit="°C" />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    labelKey="dayName"
                    formatter={(value, name, item) => (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <WeatherIcon conditionCode={item.payload.conditionCode} className="w-5 h-5" /> 
                           <span>{item.payload.description}</span>
                        </div>
                        <div>{chartConfig[name as keyof typeof chartConfig].label}: {value}°C</div>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="highTemp" fill="var(--color-highTemp)" radius={[4, 4, 0, 0]} barSize={30}>
                 <LabelList dataKey="highTemp" position="top" offset={5} formatter={(value: number) => `${value}°`} />
              </Bar>
              <Bar dataKey="lowTemp" fill="var(--color-lowTemp)" radius={[4, 4, 0, 0]} barSize={30}>
                <LabelList dataKey="lowTemp" position="top" offset={5} formatter={(value: number) => `${value}°`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hottestDay && (
            <Card className="bg-red-100 dark:bg-red-900/30 border-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-700 dark:text-red-300">Hottest Day</CardTitle>
                <CardDescription className="text-red-600 dark:text-red-400">{hottestDay.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{hottestDay.highTemp}°C</p>
                <WeatherIcon conditionCode={hottestDay.conditionCode} className="w-8 h-8 inline-block ml-2 text-red-600 dark:text-red-400"/>
              </CardContent>
            </Card>
          )}
          {coldestDay && (
            <Card className="bg-blue-100 dark:bg-blue-900/30 border-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-700 dark:text-blue-300">Coldest Day</CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-400">{coldestDay.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{coldestDay.lowTemp}°C</p>
                 <WeatherIcon conditionCode={coldestDay.conditionCode} className="w-8 h-8 inline-block ml-2 text-blue-600 dark:text-blue-400"/>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastView;
