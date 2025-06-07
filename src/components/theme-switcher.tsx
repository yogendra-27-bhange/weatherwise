
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Theme {
  name: string;
  label: string;
  primaryHsl: string; // e.g., "207 100% 71%"
  accentHsl: string;  // e.g., "207 44% 49%"
}

const themes: Theme[] = [
  { name: 'defaultBlue', label: 'Default Blue', primaryHsl: '207 100% 71%', accentHsl: '207 44% 49%' },
  { name: 'emeraldGreen', label: 'Emerald Green', primaryHsl: '145 63% 49%', accentHsl: '145 63% 39%' },
  { name: 'sunsetOrange', label: 'Sunset Orange', primaryHsl: '24 95% 53%', accentHsl: '24 95% 43%' },
  { name: 'violetPurple', label: 'Violet Purple', primaryHsl: '262 84% 59%', accentHsl: '262 84% 49%' },
];

interface ThemeSwitcherProps {
    currentTheme?: string;
    onThemeChange: (themeName: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme: initialTheme, onThemeChange }) => {
  const [selectedThemeName, setSelectedThemeName] = useState<string>(initialTheme || 'defaultBlue');

  useEffect(() => {
    // Apply theme from localStorage on initial load if no prop is passed
    const storedThemeName = localStorage.getItem('weatherWiseTheme') || 'defaultBlue';
    if (!initialTheme) {
        setSelectedThemeName(storedThemeName);
    }
    const themeToApply = themes.find(t => t.name === (initialTheme || storedThemeName));
    if (themeToApply) {
      applyTheme(themeToApply);
    }
  }, [initialTheme]);


  const applyTheme = (theme: Theme) => {
    document.documentElement.style.setProperty('--primary', theme.primaryHsl);
    // Update related primary colors for text etc. This is a simplified approach.
    // A more robust solution would involve defining more CSS vars or a darker/lighter function.
    document.documentElement.style.setProperty('--primary-foreground', theme.name === 'defaultBlue' ? '207 100% 25%' : '0 0% 98%');
    document.documentElement.style.setProperty('--ring', theme.primaryHsl);
    
    document.documentElement.style.setProperty('--accent', theme.accentHsl);
    document.documentElement.style.setProperty('--accent-foreground', '0 0% 98%');

    // For charts (optional, could be more dynamic)
    document.documentElement.style.setProperty('--chart-1', theme.primaryHsl);
    document.documentElement.style.setProperty('--chart-2', theme.accentHsl);
  };

  const handleThemeChange = (themeName: string) => {
    const theme = themes.find(t => t.name === themeName);
    if (theme) {
      setSelectedThemeName(themeName);
      applyTheme(theme);
      localStorage.setItem('weatherWiseTheme', themeName); // Save to localStorage for persistence
      onThemeChange(themeName); // Notify parent (SettingsPage)
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Select an accent color scheme:</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {themes.map((theme) => (
          <Button
            key={theme.name}
            variant={selectedThemeName === theme.name ? 'default' : 'outline'}
            onClick={() => handleThemeChange(theme.name)}
            className="w-full justify-start"
            style={{ 
              // Show a preview of the color directly on the button
              '--button-bg-preview': `hsl(${theme.primaryHsl})`,
              '--button-border-preview': `hsl(${theme.accentHsl})`,
            } as React.CSSProperties}
          >
            <span className="flex items-center">
              <span 
                className="w-4 h-4 rounded-sm mr-2 border" 
                style={{ backgroundColor: `hsl(${theme.primaryHsl})`, borderColor: `hsl(${theme.accentHsl})` }}
              ></span>
              {theme.label}
            </span>
            {selectedThemeName === theme.name && <Check className="ml-auto h-4 w-4" />}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
