
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ThemeSwitcher from '@/components/theme-switcher';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { UserPreferences, LocationInfo } from '@/types/weather';

export default function SettingsPage() {
  const [defaultLocationName, setDefaultLocationName] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const { toast } = useToast();

  useEffect(() => {
    // Load preferences from localStorage
    const storedPrefsString = localStorage.getItem('weatherWisePreferences');
    if (storedPrefsString) {
      const storedPrefs = JSON.parse(storedPrefsString) as UserPreferences;
      setPreferences(storedPrefs);
      setDefaultLocationName(storedPrefs.defaultLocationName || '');
    }
  }, []);

  const handleSavePreferences = () => {
    const newPreferences: UserPreferences = {
      ...preferences,
      defaultLocationName: defaultLocationName.trim() || undefined,
    };
    localStorage.setItem('weatherWisePreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    toast({
      title: 'Preferences Saved',
      description: 'Your settings have been saved locally.',
    });
  };
  
  // Effect to load default location on app start (in HomePage.tsx)
  // This page only handles setting it.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-3xl mb-8">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" asChild>
            <Link href="/" aria-label="Back to Home">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-primary">Settings</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      <main className="w-full max-w-3xl space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>General Preferences</CardTitle>
            <CardDescription>Customize your WeatherWise experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="defaultLocation" className="text-base">Default Location</Label>
              <Input
                id="defaultLocation"
                type="text"
                value={defaultLocationName}
                onChange={(e) => setDefaultLocationName(e.target.value)}
                placeholder="e.g., London, New York"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set a location to load automatically on startup.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
            <CardDescription>Personalize the look and feel of the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher currentTheme={preferences.themeColor} onThemeChange={(theme) => setPreferences(prev => ({...prev, themeColor: theme}))} />
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button onClick={handleSavePreferences} size="lg">
            <Save className="mr-2 h-5 w-5" /> Save All Preferences
          </Button>
        </div>
      </main>
      <footer className="w-full max-w-3xl mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          WeatherWise Settings &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
