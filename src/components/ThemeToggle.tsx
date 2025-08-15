import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Palette, Coffee, Waves } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'default' | 'ocean' | 'beige' | 'warm';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'system';
  });
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('colorScheme') as ColorScheme;
    return saved || 'default';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply theme
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color scheme
    root.classList.remove('theme-ocean', 'theme-beige', 'theme-warm');
    if (colorScheme !== 'default') {
      root.classList.add(`theme-${colorScheme}`);
    }

    // Save preferences
    localStorage.setItem('theme', theme);
    localStorage.setItem('colorScheme', colorScheme);
  }, [theme, colorScheme]);

  const themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: Sun },
    { value: 'dark' as Theme, label: 'Dark', icon: Moon },
    { value: 'system' as Theme, label: 'System', icon: Monitor }
  ];

  const colorSchemeOptions = [
    { value: 'default' as ColorScheme, label: 'Modern Purple', color: 'linear-gradient(135deg, #8B5CF6, #6366F1)', icon: Palette },
    { value: 'ocean' as ColorScheme, label: 'Ocean Blue', color: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', icon: Waves },
    { value: 'beige' as ColorScheme, label: 'Sepia Reading', color: 'linear-gradient(135deg, #F59E0B, #D97706)', icon: Coffee },
    { value: 'warm' as ColorScheme, label: 'Warm Sunset', color: 'linear-gradient(135deg, #EF4444, #F97316)', icon: Sun }
  ];

  const currentThemeIcon = themeOptions.find(option => option.value === theme)?.icon || Monitor;
  const CurrentIcon = currentThemeIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2 hover:bg-surface-hover transition-colors"
          aria-label="Toggle theme"
        >
          <CurrentIcon className="h-4 w-4" />
          <div 
            className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background"
            style={{ 
              background: colorSchemeOptions.find(opt => opt.value === colorScheme)?.color 
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-surface-elevated/95 backdrop-blur-lg border-border-subtle">
        <DropdownMenuLabel className="text-text-secondary">Theme Mode</DropdownMenuLabel>
        
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="gap-3 cursor-pointer hover:bg-surface-hover"
          >
            <Icon className="h-4 w-4 text-text-secondary" />
            <span className="flex-1">{label}</span>
            {theme === value && (
              <div className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-border-subtle" />
        
        <DropdownMenuLabel className="text-text-secondary">Color Scheme</DropdownMenuLabel>
        
        {colorSchemeOptions.map(({ value, label, color, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setColorScheme(value)}
            className="gap-3 cursor-pointer hover:bg-surface-hover"
          >
            <div className="relative">
              {Icon && <Icon className="h-4 w-4 text-text-secondary" />}
              <div 
                className="absolute inset-0 opacity-30 blur-sm"
                style={{ background: color }}
              />
            </div>
            <span className="flex-1">{label}</span>
            <div 
              className="h-4 w-4 rounded-full border border-border-subtle shadow-sm"
              style={{ background: color }}
            />
            {colorScheme === value && (
              <div className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}