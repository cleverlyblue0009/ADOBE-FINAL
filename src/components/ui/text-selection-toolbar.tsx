import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ColorPicker, HIGHLIGHT_COLORS, HighlightColor } from './color-picker';
import { Copy, Highlighter, Sparkles, BookOpen, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TextSelectionToolbarProps {
  selectedText: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onHighlight: (text: string, color: HighlightColor) => void;
  onSimplify: (text: string) => void;
  onAnalyze: (text: string) => void;
  onCopy: (text: string) => void;
  onClose: () => void;
}

export function TextSelectionToolbar({
  selectedText,
  isVisible,
  position,
  onHighlight,
  onSimplify,
  onAnalyze,
  onCopy,
  onClose
}: TextSelectionToolbarProps) {
  const [selectedColor, setSelectedColor] = useState<HighlightColor>(HIGHLIGHT_COLORS[0]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !selectedText) {
    return null;
  }

  const handleHighlight = () => {
    onHighlight(selectedText, selectedColor);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      onCopy(selectedText);
      onClose();
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleSimplify = () => {
    onSimplify(selectedText);
    onClose();
  };

  const handleAnalyze = () => {
    onAnalyze(selectedText);
    onClose();
  };

  return (
    <Card
      ref={toolbarRef}
      className="fixed z-50 p-2 bg-surface-elevated/95 backdrop-blur-md border border-border-subtle shadow-2xl animate-fade-in"
      style={{
        left: Math.max(10, Math.min(position.x - 150, window.innerWidth - 320)),
        top: Math.max(10, position.y - 60),
      }}
    >
      <div className="flex items-center gap-2">
        {/* Highlight with color picker */}
        <ColorPicker
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHighlight}
              className="gap-2 hover:bg-brand-primary/10 hover:text-brand-primary"
            >
              <Highlighter className="h-4 w-4" />
              Highlight
            </Button>
          }
        />

        <div className="w-px h-6 bg-border-subtle" />

        {/* Copy */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2 hover:bg-surface-hover"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>

        {/* Simplify */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSimplify}
          className="gap-2 hover:bg-brand-secondary/10 hover:text-brand-secondary"
        >
          <Sparkles className="h-4 w-4" />
          Simplify
        </Button>

        {/* Analyze */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAnalyze}
          className="gap-2 hover:bg-brand-accent/10 hover:text-brand-accent"
        >
          <BookOpen className="h-4 w-4" />
          Analyze
        </Button>
      </div>

      {/* Selected text preview */}
      <div className="mt-2 pt-2 border-t border-border-subtle">
        <p className="text-xs text-text-secondary max-w-xs truncate">
          "{selectedText}"
        </p>
      </div>
    </Card>
  );
}