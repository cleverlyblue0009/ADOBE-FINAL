import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Link,
  Copy,
  Loader2,
  X,
  Highlighter,
  Languages
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TextSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  pageContext?: string;
  documentId?: string;
  onHighlight?: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onClose: () => void;
}

interface AIInsight {
  type: 'simplification' | 'insight' | 'definition' | 'connection';
  content: string;
  title: string;
}

export function TextSelectionMenu({
  selectedText,
  position,
  pageContext,
  documentId,
  onHighlight,
  onClose
}: TextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAIAction = async (action: 'simplify' | 'insights' | 'define' | 'connections' | 'translate') => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    try {
      let result;
      let title;
      let type: AIInsight['type'];

      switch (action) {
        case 'simplify':
          result = await apiService.simplifyText(selectedText);
          title = '🧠 Simplified Text';
          type = 'simplification';
          break;
        case 'insights':
          result = await apiService.generateInsights(selectedText, 'general', 'understanding');
          title = '💡 Generated Insights';
          type = 'insight';
          break;
        case 'define':
          result = await apiService.defineTerms(selectedText, pageContext || '');
          title = '📖 Term Definitions';
          type = 'definition';
          break;
        case 'connections':
          result = await apiService.findConnections(selectedText, documentId || '');
          title = '🔗 Related Connections';
          type = 'connection';
          break;
        case 'translate':
          result = await apiService.translateText(selectedText, 'spanish'); // Default to Spanish
          title = '🌍 Translated Text';
          type = 'connection'; // Reuse connection type for now
          break;
        default:
          throw new Error('Unknown action');
      }

      setAiInsight({
        type,
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        title
      });
    } catch (error) {
      console.error(`Failed to ${action} text:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} the selected text. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300' },
    { name: 'Green', value: 'green', color: 'bg-green-300' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300' }
  ];

  if (!position || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <Card className="shadow-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-md text-white">
        {/* AI Insight Display */}
        {aiInsight && (
          <div className="p-4 border-b border-gray-700 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{aiInsight.title}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiInsight(null)}
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm text-gray-300 max-h-32 overflow-y-auto">
              {aiInsight.content}
            </div>
          </div>
        )}

        <div className="p-2">
          {/* Main Actions Row */}
          <div className="flex items-center gap-1 mb-2">
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAIAction('simplify')}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-2 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200"
                title="Simplify Text"
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                <span className="text-xs">Simplify</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAIAction('insights')}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-2 hover:bg-purple-600/20 text-purple-300 hover:text-purple-200"
                title="Generate Insights"
              >
                <Lightbulb className="h-3 w-3" />
                <span className="text-xs">Insights</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAIAction('define')}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-2 hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-200"
                title="Define Terms"
              >
                <BookOpen className="h-3 w-3" />
                <span className="text-xs">Define</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAIAction('connections')}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-2 hover:bg-green-600/20 text-green-300 hover:text-green-200"
                title="Find Connections"
              >
                <Link className="h-3 w-3" />
                <span className="text-xs">Connect</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="flex flex-col gap-1 h-auto p-2 hover:bg-gray-600/20 text-gray-300 hover:text-gray-200"
                title="Copy Text"
              >
                <Copy className="h-3 w-3" />
                <span className="text-xs">Copy</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAIAction('translate')}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-2 hover:bg-orange-600/20 text-orange-300 hover:text-orange-200"
                title="Translate Text"
              >
                <Languages className="h-3 w-3" />
                <span className="text-xs">Translate</span>
              </Button>
            </div>
          </div>

          {/* Highlight Section */}
          {onHighlight && (
            <div className="border-t border-gray-700 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="gap-2 hover:bg-yellow-600/20 text-yellow-300 hover:text-yellow-200 mb-2"
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" />
                <span className="text-xs">Highlight</span>
              </Button>

              {/* Color Picker */}
              {showColorPicker && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Color:</span>
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onHighlight(color.value as any);
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 rounded-full ${color.color} hover:scale-110 transition-transform border-2 border-gray-600 shadow-sm`}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Text Preview */}
          <div className="pt-2 border-t border-gray-700 max-w-xs">
            <p className="text-xs text-gray-400 line-clamp-2">
              "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}