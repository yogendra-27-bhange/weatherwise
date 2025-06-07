
'use client';

import { useState, useEffect, useRef } from 'react';
import type { WeatherAlertPreference, WeatherData } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { BellRing, Save, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface WeatherAlertsProps {
  weatherData: WeatherData | null;
  isLoading: boolean;
}

const initialPreferences: WeatherAlertPreference[] = [
  { id: 'rainTomorrow', label: 'Notify if rain is expected tomorrow', key: 'rainTomorrow', type: 'boolean', enabled: false },
  { id: 'tempAbove35', label: 'Notify if temperature goes above 35°C', key: 'tempAbove35', type: 'number_gt', threshold: 35, enabled: false },
  { id: 'tempBelow5', label: 'Notify if temperature goes below 5°C', key: 'tempBelow5', type: 'number_lt', threshold: 5, enabled: false },
];

const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ weatherData, isLoading }) => {
  const [preferences, setPreferences] = useState<WeatherAlertPreference[]>(initialPreferences);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const { toast } = useToast();
  const prevActiveAlertsRef = useRef<string[]>([]);

  const handlePreferenceChange = (id: string, value: boolean | number) => {
    setPreferences(prev =>
      prev.map(p => {
        if (p.id === id) {
          if (typeof value === 'boolean') return { ...p, enabled: value };
          if (typeof value === 'number') return { ...p, threshold: value, enabled: p.enabled }; // Keep enabled state when changing threshold
        }
        return p;
      })
    );
  };
  
  const handleToggleEnable = (id: string) => {
    setPreferences(prev => 
      prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    );
  };

  useEffect(() => {
    // In a real app, load preferences from Firestore or localStorage
    // For now, we just use initialPreferences set in useState
    // Consider loading from localStorage if preferences were saved there.
  }, []);

  useEffect(() => {
    if (isLoading || !weatherData) {
      if (activeAlerts.length > 0) {
        setActiveAlerts([]);
      }
      return;
    }

    const newAlerts: string[] = [];
    preferences.forEach(pref => {
      if (!pref.enabled) return;

      if (pref.key === 'rainTomorrow') {
        const tomorrow = weatherData.daily?.[1];
        if (tomorrow && (tomorrow.conditionCode.includes('09') || tomorrow.conditionCode.includes('10') || tomorrow.description.toLowerCase().includes('rain'))) {
          const alertMsg = `Rain is expected tomorrow (${tomorrow.description}).`;
          if (!newAlerts.includes(alertMsg)) newAlerts.push(alertMsg);
        }
      } else if (pref.key === 'tempAbove35' && pref.threshold !== undefined) {
        if (weatherData.current.temp > pref.threshold) {
          const alertMsg = `Current temperature (${weatherData.current.temp}°C) is above your alert threshold of ${pref.threshold}°C.`;
          if (!newAlerts.includes(alertMsg)) newAlerts.push(alertMsg);
        }
        weatherData.daily?.forEach(day => {
          if (day.highTemp > (pref.threshold ?? 35)) { // Use default threshold for safety if undefined
            const alertMsg = `High temperature alert: ${day.dayName} will reach ${day.highTemp}°C (threshold ${pref.threshold}°C).`;
            if (!newAlerts.includes(alertMsg)) newAlerts.push(alertMsg);
          }
        });
      } else if (pref.key === 'tempBelow5' && pref.threshold !== undefined) {
        if (weatherData.current.temp < pref.threshold) {
          const alertMsg = `Current temperature (${weatherData.current.temp}°C) is below your alert threshold of ${pref.threshold}°C.`;
          if (!newAlerts.includes(alertMsg)) newAlerts.push(alertMsg);
        }
        weatherData.daily?.forEach(day => {
          if (day.lowTemp < (pref.threshold ?? 5)) { // Use default threshold for safety
            const alertMsg = `Low temperature alert: ${day.dayName} will drop to ${day.lowTemp}°C (threshold ${pref.threshold}°C).`;
            if (!newAlerts.includes(alertMsg)) newAlerts.push(alertMsg);
          }
        });
      }
    });

    if (newAlerts.length !== activeAlerts.length || newAlerts.some((alert, i) => alert !== activeAlerts[i])) {
      setActiveAlerts(newAlerts);
    }
  }, [preferences, weatherData, isLoading, activeAlerts]);


  useEffect(() => {
    const newlyActivatedAlerts = activeAlerts.filter(
      alertMsg => !prevActiveAlertsRef.current.includes(alertMsg)
    );

    if (newlyActivatedAlerts.length > 0 && !isLoading) { 
      newlyActivatedAlerts.forEach((alertMsg, index) => {
          toast({
              title: "Weather Alert!",
              description: alertMsg,
              variant: "default", 
              duration: 7000 + index * 1000,
          });
      });
    }
    prevActiveAlertsRef.current = [...activeAlerts]; 
  }, [activeAlerts, toast, isLoading]);


  const savePreferences = () => {
    // Here you would save preferences to localStorage or a backend
    localStorage.setItem('weatherWiseAlertPreferences', JSON.stringify(preferences));
    toast({
      title: "Preferences Saved",
      description: "Your weather alert preferences have been saved locally.",
    });
  };

  useEffect(() => {
    const storedPrefsString = localStorage.getItem('weatherWiseAlertPreferences');
    if (storedPrefsString) {
        try {
            const storedPrefs = JSON.parse(storedPrefsString) as WeatherAlertPreference[];
            // Ensure loaded prefs match the structure/keys of initialPreferences to avoid issues with outdated stored data
            const validStoredPrefs = storedPrefs.filter(sp => initialPreferences.some(ip => ip.id === sp.id));
            if (validStoredPrefs.length > 0) {
                 // Merge: take structure from initial, values from stored if they exist
                const mergedPreferences = initialPreferences.map(ip => {
                    const foundStored = validStoredPrefs.find(sp => sp.id === ip.id);
                    return foundStored ? { ...ip, ...foundStored } : ip; // Prioritize stored values for known keys
                });
                setPreferences(mergedPreferences);
            }
        } catch (e) {
            console.error("Failed to parse stored alert preferences:", e);
            localStorage.removeItem('weatherWiseAlertPreferences'); // Clear corrupted data
        }
    }
  }, []);


  if (isLoading && !weatherData) {
     return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <BellRing className="w-5 h-5 mr-2 text-primary" /> Custom Weather Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(initialPreferences.length)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 p-3 border rounded-md bg-background/50">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 flex-grow" />
            </div>
          ))}
          <Button disabled className="mt-2">
            <Save className="w-4 h-4 mr-2" /> Save Preferences
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md bg-background/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <BellRing className="w-5 h-5 mr-2 text-primary" /> Custom Weather Alerts
        </CardTitle>
        <CardDescription>Set up notifications for specific weather conditions. Preferences are saved locally.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences.map(pref => (
          <div key={pref.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-background/50 gap-2">
            <div className="flex items-center space-x-3 flex-grow">
              <Checkbox
                id={pref.id}
                checked={pref.enabled}
                onCheckedChange={() => handleToggleEnable(pref.id)}
                aria-labelledby={`label-${pref.id}`}
              />
              <Label id={`label-${pref.id}`} htmlFor={pref.id} className="flex-grow cursor-pointer text-sm">{pref.label}</Label>
            </div>
            {pref.type !== 'boolean' && pref.enabled && (
              <Input
                type="number"
                value={pref.threshold}
                onChange={(e) => handlePreferenceChange(pref.id, parseInt(e.target.value) || 0)} // Ensure value is number
                className="w-20 h-8 ml-0 sm:ml-2 mt-2 sm:mt-0"
                placeholder="°C"
                aria-label={`Threshold for ${pref.label}`}
              />
            )}
          </div>
        ))}
        <Button onClick={savePreferences} className="mt-2">
          <Save className="w-4 h-4 mr-2" /> Save Preferences
        </Button>

        {!isLoading && !weatherData && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" />
                Weather data is not available to check alerts. Please select a location.
            </div>
        )}

        {weatherData && !isLoading && activeAlerts.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-md flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-yellow-500"/> Active Conditions Met:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground pl-2">
              {activeAlerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </div>
        )}
        {weatherData && !isLoading && activeAlerts.length === 0 && (
          <div className="mt-4 text-sm text-green-600 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> No active alert conditions met based on your preferences.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;
