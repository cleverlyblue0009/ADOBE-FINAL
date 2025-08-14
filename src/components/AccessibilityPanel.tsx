import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Type, 
  Eye, 
  Volume2, 
  BookOpen, 
  Accessibility,
  Languages,
  Timer,
  PauseCircle,
  PlayCircle,
  VolumeX
} from 'lucide-react';

// CSS-in-JS for accessibility features
const applyAccessibilityStyles = (settings: {
  fontSize: number;
  lineHeight: number;
  dyslexiaMode: boolean;
  colorBlindMode: boolean;
  colorBlindType: 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
}) => {
  const root = document.documentElement;
  
  // Apply font size
  root.style.setProperty('--accessibility-font-size', `${settings.fontSize}px`);
  
  // Apply line height
  root.style.setProperty('--accessibility-line-height', settings.lineHeight.toString());
  
  // Apply dyslexia mode (OpenDyslexic font, increased spacing)
  if (settings.dyslexiaMode) {
    root.style.setProperty('--accessibility-font-family', 'OpenDyslexic, Arial, sans-serif');
    root.style.setProperty('--accessibility-letter-spacing', '0.1em');
    root.style.setProperty('--accessibility-word-spacing', '0.2em');
  } else {
    root.style.setProperty('--accessibility-font-family', 'inherit');
    root.style.setProperty('--accessibility-letter-spacing', 'normal');
    root.style.setProperty('--accessibility-word-spacing', 'normal');
  }
  
  // Apply color blind mode (high contrast colors + PDF modifications)
  if (settings.colorBlindMode) {
    // UI Colors
    root.style.setProperty('--accessibility-text-color', '#000000');
    root.style.setProperty('--accessibility-bg-color', '#ffffff');
    root.style.setProperty('--accessibility-link-color', '#0000EE');
    
    // PDF-specific colors for color blind users
    root.style.setProperty('--pdf-text-color', '#000000');
    root.style.setProperty('--pdf-bg-color', '#ffffff');
    
    // Different highlight colors based on color blind type
    if (settings.colorBlindType === 'protanopia') {
      // Red-green color blind - use blue and yellow
      root.style.setProperty('--pdf-highlight-primary', '#0066CC');      // Blue
      root.style.setProperty('--pdf-highlight-secondary', '#FFCC00');    // Yellow
      root.style.setProperty('--pdf-highlight-tertiary', '#CC0066');     // Magenta
    } else if (settings.colorBlindType === 'deuteranopia') {
      // Green-red color blind - use blue and orange
      root.style.setProperty('--pdf-highlight-primary', '#0066CC');      // Blue
      root.style.setProperty('--pdf-highlight-secondary', '#FF6600');    // Orange
      root.style.setProperty('--pdf-highlight-tertiary', '#CC0066');     // Magenta
    } else if (settings.colorBlindType === 'tritanopia') {
      // Blue-yellow color blind - use red and green
      root.style.setProperty('--pdf-highlight-primary', '#CC0000');      // Red
      root.style.setProperty('--pdf-highlight-secondary', '#00CC00');    // Green
      root.style.setProperty('--pdf-highlight-tertiary', '#CC0066');     // Magenta
    }
    
    root.style.setProperty('--pdf-border-color', '#000000');           // Black borders
    root.style.setProperty('--pdf-shadow-color', '#000000');          // Black shadows
    
    // Add color blind friendly filter to PDF viewer based on type
    const pdfViewers = document.querySelectorAll('.pdf-viewer, iframe, canvas');
    pdfViewers.forEach((viewer: any) => {
      if (viewer.style) {
        let filter = 'contrast(1.5) saturate(0.8) brightness(1.1)';
        
        // Add specific filters for different color blind types
        if (settings.colorBlindType === 'protanopia') {
          filter += ' hue-rotate(180deg)';
        } else if (settings.colorBlindType === 'deuteranopia') {
          filter += ' hue-rotate(180deg) saturate(1.2)';
        } else if (settings.colorBlindType === 'tritanopia') {
          filter += ' hue-rotate(90deg) contrast(1.8)';
        }
        
        viewer.style.filter = filter;
      }
    });
  } else {
    // Reset to default colors
    root.style.setProperty('--accessibility-text-color', 'inherit');
    root.style.setProperty('--accessibility-bg-color', 'inherit');
    root.style.setProperty('--accessibility-link-color', 'inherit');
    
    // Reset PDF colors
    root.style.setProperty('--pdf-text-color', 'inherit');
    root.style.setProperty('--pdf-bg-color', 'inherit');
    root.style.setProperty('--pdf-highlight-primary', 'inherit');
    root.style.setProperty('--pdf-highlight-secondary', 'inherit');
    root.style.setProperty('--pdf-highlight-tertiary', 'inherit');
    root.style.setProperty('--pdf-border-color', 'inherit');
    root.style.setProperty('--pdf-shadow-color', 'inherit');
    
    // Remove color blind filter from PDF viewers
    const pdfViewers = document.querySelectorAll('.pdf-viewer, iframe, canvas');
    pdfViewers.forEach((viewer: any) => {
      if (viewer.style) {
        viewer.style.filter = 'none';
      }
    });
  }
  
  // Apply high contrast
  if (settings.highContrast) {
    root.style.setProperty('--accessibility-border-color', '#000000');
    root.style.setProperty('--accessibility-shadow', '2px 2px 4px rgba(0,0,0,0.8)');
  } else {
    root.style.setProperty('--accessibility-border-color', 'inherit');
    root.style.setProperty('--accessibility-shadow', 'inherit');
  }
};

interface AccessibilityPanelProps {
  currentText?: string;
  onFontSizeChange?: (size: number) => void;
  onDyslexiaModeChange?: (enabled: boolean) => void;
  onColorBlindModeChange?: (enabled: boolean) => void;
  onLanguageChange?: (language: string) => void;
}

export function AccessibilityPanel({ currentText, onFontSizeChange, onDyslexiaModeChange, onColorBlindModeChange, onLanguageChange }: AccessibilityPanelProps) {
  const [fontSize, setFontSize] = useState([16]);
  const [lineHeight, setLineHeight] = useState([1.5]);
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [colorBlindType, setColorBlindType] = useState<'protanopia' | 'deuteranopia' | 'tritanopia'>('protanopia');
  const [highContrast, setHighContrast] = useState(false);
  const [voiceReading, setVoiceReading] = useState(false);
  const [simplifyText, setSimplifyText] = useState(false);
  const [showDefinitions, setShowDefinitions] = useState(true);
  const [readingTimer, setReadingTimer] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const { toast } = useToast();

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Apply accessibility styles whenever settings change
  useEffect(() => {
    applyAccessibilityStyles({
      fontSize: fontSize[0],
      lineHeight: lineHeight[0],
      dyslexiaMode,
      colorBlindMode,
      colorBlindType,
      highContrast
    });
    
    // Notify parent components
    if (onFontSizeChange) {
      onFontSizeChange(fontSize[0]);
    }
    if (onDyslexiaModeChange) {
      onDyslexiaModeChange(dyslexiaMode);
    }
    if (onColorBlindModeChange) {
      onColorBlindModeChange(colorBlindMode);
    }
  }, [fontSize, lineHeight, dyslexiaMode, colorBlindMode, colorBlindType, highContrast, onFontSizeChange, onDyslexiaModeChange, onColorBlindModeChange]);

  // Handle language changes
  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(selectedLanguage);
    }
    
    // Apply language-specific styles
    const root = document.documentElement;
    root.setAttribute('lang', selectedLanguage);
    
    // Add RTL support for Arabic and Hebrew
    if (selectedLanguage === 'ar' || selectedLanguage === 'he') {
      root.style.setProperty('--accessibility-text-direction', 'rtl');
      document.body.style.direction = 'rtl';
    } else {
      root.style.setProperty('--accessibility-text-direction', 'ltr');
      document.body.style.direction = 'ltr';
    }
  }, [selectedLanguage, onLanguageChange]);

  const readingModes = [
    { id: 'normal', label: 'Normal', active: !dyslexiaMode && !colorBlindMode },
    { id: 'dyslexia', label: 'Dyslexia Friendly', active: dyslexiaMode },
    { id: 'colorblind', label: 'Color Blind Friendly', active: colorBlindMode }
  ];

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', label: 'French', flag: '🇫🇷' },
    { code: 'de', label: 'German', flag: '🇩🇪' },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
    { code: 'he', label: 'Hebrew', flag: '🇮🇱' }
  ];

  const handleVoiceReading = () => {
    if (!speechSynthesis) {
      toast({
        title: "Voice reading not supported",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive"
      });
      return;
    }

    if (voiceReading && currentUtterance) {
      // Stop current reading
      speechSynthesis.cancel();
      setVoiceReading(false);
      setCurrentUtterance(null);
    } else {
      // Start reading
      if (!currentText) {
        toast({
          title: "No text to read",
          description: "Please select some text or navigate to a section with content.",
          variant: "destructive"
        });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.rate = voiceSpeed[0];
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setVoiceReading(true);
        setCurrentUtterance(utterance);
      };
      
      utterance.onend = () => {
        setVoiceReading(false);
        setCurrentUtterance(null);
      };
      
      utterance.onerror = () => {
        setVoiceReading(false);
        setCurrentUtterance(null);
        toast({
          title: "Voice reading failed",
          description: "Unable to read the text. Please try again.",
          variant: "destructive"
        });
      };

      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-2">
          <Accessibility className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-text-primary">Accessibility</h3>
        </div>
        <p className="text-xs text-text-secondary">
          Customize reading experience for comfort and accessibility
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Typography Settings */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Typography</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-text-secondary">Font Size</label>
                  <span className="text-xs text-text-tertiary">{fontSize[0]}px</span>
                </div>
                <Slider
                  value={fontSize}
                  onValueChange={setFontSize}
                  min={12}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-text-secondary">Line Height</label>
                  <span className="text-xs text-text-tertiary">{lineHeight[0]}</span>
                </div>
                <Slider
                  value={lineHeight}
                  onValueChange={setLineHeight}
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </section>

          {/* Reading Modes */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Reading Modes</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Dyslexia Friendly</label>
                <Switch
                  checked={dyslexiaMode}
                  onCheckedChange={setDyslexiaMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Color Blind Friendly</label>
                <Switch
                  checked={colorBlindMode}
                  onCheckedChange={setColorBlindMode}
                />
              </div>
              
              {colorBlindMode && (
                <div className="pl-4 space-y-2 animate-fade-in">
                  <label className="text-xs text-text-secondary">Color Blind Type:</label>
                  <div className="flex gap-2">
                    <Button
                      variant={colorBlindType === 'protanopia' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setColorBlindType('protanopia')}
                      className="text-xs"
                    >
                      Red-Green
                    </Button>
                    <Button
                      variant={colorBlindType === 'deuteranopia' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setColorBlindType('deuteranopia')}
                      className="text-xs"
                    >
                      Green-Red
                    </Button>
                    <Button
                      variant={colorBlindType === 'tritanopia' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setColorBlindType('tritanopia')}
                      className="text-xs"
                    >
                      Blue-Yellow
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">High Contrast</label>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                />
              </div>

              <div className="flex gap-1 flex-wrap">
                {readingModes.map(mode => (
                  <Badge
                    key={mode.id}
                    variant={mode.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {mode.label}
                  </Badge>
                ))}
              </div>
              
              {/* Color Blind Preview */}
              {colorBlindMode && (
                <div className="pl-4 space-y-2 animate-fade-in">
                  <label className="text-xs text-text-secondary">Preview Colors:</label>
                  <div className="flex gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-border-subtle"
                      style={{ backgroundColor: colorBlindType === 'protanopia' ? '#0066CC' : 
                              colorBlindType === 'deuteranopia' ? '#0066CC' : '#CC0000' }}
                      title="Primary Highlight"
                    ></div>
                    <div 
                      className="w-4 h-4 rounded border border-border-subtle"
                      style={{ backgroundColor: colorBlindType === 'protanopia' ? '#FFCC00' : 
                              colorBlindType === 'deuteranopia' ? '#FF6600' : '#00CC00' }}
                      title="Secondary Highlight"
                    ></div>
                    <div 
                      className="w-4 h-4 rounded border border-border-subtle"
                      style={{ backgroundColor: '#CC0066' }}
                      title="Tertiary Highlight"
                    ></div>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    These colors will be used for PDF highlights and are optimized for {colorBlindType === 'protanopia' ? 'red-green' : 
                    colorBlindType === 'deuteranopia' ? 'green-red' : 'blue-yellow'} color blindness.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Language Selection */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Language</h4>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={selectedLanguage === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className="justify-start gap-2 h-10"
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-xs">{lang.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Voice Features */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Voice Features</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Voice Reading</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceReading}
                    className="p-1"
                    disabled={!speechSynthesis}
                  >
                    {voiceReading ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : speechSynthesis ? (
                      <PlayCircle className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                  <Switch
                    checked={voiceReading}
                    onCheckedChange={handleVoiceReading}
                    disabled={!speechSynthesis}
                  />
                </div>
              </div>

              {/* Voice Speed Control */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-text-secondary">Voice Speed</label>
                  <span className="text-xs text-text-tertiary">{voiceSpeed[0]}x</span>
                </div>
                <Slider
                  value={voiceSpeed}
                  onValueChange={setVoiceSpeed}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                  disabled={!speechSynthesis}
                />
              </div>
              
              {voiceReading && (
                <div className="pl-4 space-y-2 animate-fade-in">
                  <div className="text-xs text-text-tertiary">
                    Reading speed: Normal • Voice: Sarah (US English)
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Slower
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Faster
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Text Simplification */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Text Enhancement</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Simplify Complex Words</label>
                <Switch
                  checked={simplifyText}
                  onCheckedChange={setSimplifyText}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Show Definitions on Hover</label>
                <Switch
                  checked={showDefinitions}
                  onCheckedChange={setShowDefinitions}
                />
              </div>
            </div>
          </section>

          {/* Language Support */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Language</h4>
            </div>
            
            <div className="space-y-2">
              {languages.map(lang => (
                <Button
                  key={lang.code}
                  variant={lang.code === selectedLanguage ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    toast({
                      title: "Language changed",
                      description: `Interface language set to ${lang.label}`,
                    });
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {lang.code === selectedLanguage && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </section>

          {/* Reading Timer */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-4 w-4 text-text-secondary" />
              <h4 className="text-sm font-medium text-text-primary">Reading Progress</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Show Reading Timer</label>
                <Switch
                  checked={readingTimer}
                  onCheckedChange={setReadingTimer}
                />
              </div>
              
              {readingTimer && (
                <div className="p-3 bg-background-secondary rounded-lg animate-fade-in">
                  <div className="text-xs text-text-secondary mb-1">Session Progress</div>
                  <div className="text-sm font-medium text-text-primary">12 min 34 sec</div>
                  <div className="text-xs text-text-tertiary mt-1">
                    Average reading speed: 250 WPM
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}