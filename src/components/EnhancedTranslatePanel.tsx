import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Languages, 
  Globe,
  Loader2,
  Copy,
  RotateCcw,
  Volume2,
  Download,
  Zap
} from 'lucide-react';

interface EnhancedTranslatePanelProps {
  originalText?: string;
  onTranslatedText?: (text: string, language: string) => void;
  className?: string;
}

export function EnhancedTranslatePanel({ originalText, onTranslatedText, className = '' }: EnhancedTranslatePanelProps) {
  const [targetLanguage, setTargetLanguage] = useState<string>('spanish');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<Array<{
    original: string;
    translated: string;
    language: string;
    timestamp: number;
  }>>([]);
  const { toast } = useToast();

  const languages = [
    { value: 'spanish', label: 'Spanish', flag: '🇪🇸', code: 'es' },
    { value: 'french', label: 'French', flag: '🇫🇷', code: 'fr' },
    { value: 'german', label: 'German', flag: '🇩🇪', code: 'de' },
    { value: 'italian', label: 'Italian', flag: '🇮🇹', code: 'it' },
    { value: 'portuguese', label: 'Portuguese', flag: '🇵🇹', code: 'pt' },
    { value: 'chinese', label: 'Chinese (Simplified)', flag: '🇨🇳', code: 'zh' },
    { value: 'japanese', label: 'Japanese', flag: '🇯🇵', code: 'ja' },
    { value: 'korean', label: 'Korean', flag: '🇰🇷', code: 'ko' },
    { value: 'arabic', label: 'Arabic', flag: '🇸🇦', code: 'ar' },
    { value: 'hindi', label: 'Hindi', flag: '🇮🇳', code: 'hi' },
    { value: 'russian', label: 'Russian', flag: '🇷🇺', code: 'ru' },
    { value: 'dutch', label: 'Dutch', flag: '🇳🇱', code: 'nl' }
  ];

  // Auto-translate when originalText changes
  useEffect(() => {
    if (originalText && originalText.trim()) {
      handleTranslate();
    }
  }, [originalText, targetLanguage]);

  const handleTranslate = async () => {
    if (!originalText?.trim()) {
      toast({
        title: "No text to translate",
        description: "Please select text to translate.",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await apiService.translateText(originalText, targetLanguage);
      setTranslatedText(translated);
      
      // Add to history
      const newHistoryItem = {
        original: originalText,
        translated,
        language: targetLanguage,
        timestamp: Date.now()
      };
      setTranslationHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]); // Keep last 5
      
      if (onTranslatedText) {
        onTranslatedText(translated, targetLanguage);
      }
      
      const selectedLanguage = languages.find(l => l.value === targetLanguage);
      toast({
        title: "Translation Complete",
        description: `Text translated to ${selectedLanguage?.label}`,
      });
      
    } catch (error) {
      console.error('Failed to translate text:', error);
      toast({
        title: "Translation failed",
        description: "Unable to translate text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyTranslated = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      toast({
        title: "Copied to clipboard",
        description: "Translated text has been copied.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setTranslatedText('');
    setTranslationHistory([]);
  };

  const speakTranslation = () => {
    if (translatedText && 'speechSynthesis' in window) {
      const selectedLanguage = languages.find(l => l.value === targetLanguage);
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = selectedLanguage?.code || 'en';
      speechSynthesis.speak(utterance);
      
      toast({
        title: "Speaking translation",
        description: `Playing audio in ${selectedLanguage?.label}`,
      });
    }
  };

  const selectedLanguage = languages.find(l => l.value === targetLanguage);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border-subtle bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <Languages className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Smart Translate
              <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
            </h3>
            <p className="text-xs text-text-secondary">
              Instant translation with context awareness
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Language Selection */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Translate to
            </label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Translate Button */}
          <Button 
            onClick={handleTranslate}
            disabled={!originalText || isTranslating}
            className="w-full gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Translate Text
              </>
            )}
          </Button>

          {/* Translated Text */}
          {translatedText && (
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-text-primary flex items-center gap-2">
                    <span className="text-lg">{selectedLanguage?.flag}</span>
                    {selectedLanguage?.label} Translation
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={speakTranslation}
                      className="p-1.5"
                      title="Listen to translation"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTranslated}
                      className="p-1.5"
                      title="Copy translation"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="p-1.5"
                      title="Clear translation"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-40">
                  <div className="text-sm text-text-primary leading-relaxed font-medium">
                    {translatedText}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Original Text Preview */}
          {originalText && (
            <Card className="bg-gray-50 dark:bg-gray-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Original Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-text-secondary max-h-20 overflow-y-auto leading-relaxed">
                  {originalText.substring(0, 200)}
                  {originalText.length > 200 && '...'}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Translation History */}
          {translationHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Recent Translations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {translationHistory.map((item, index) => {
                      const lang = languages.find(l => l.value === item.language);
                      return (
                        <div key={index} className="text-xs border rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                             onClick={() => {
                               setTranslatedText(item.translated);
                               setTargetLanguage(item.language);
                             }}>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm">{lang?.flag}</span>
                            <span className="font-medium">{lang?.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </Badge>
                          </div>
                          <div className="text-text-secondary line-clamp-2">
                            {item.translated.substring(0, 80)}...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Usage Tips */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Pro Tips
              </h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Select text in PDF to translate specific sections</li>
                <li>• Click on recent translations to reuse them</li>
                <li>• Use the speaker icon to hear pronunciation</li>
                <li>• Translations maintain context from the document</li>
                <li>• Copy translations to use in notes or sharing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}