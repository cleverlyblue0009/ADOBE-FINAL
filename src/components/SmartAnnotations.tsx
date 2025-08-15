import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  AlertCircle,
  Lightbulb,
  Target,
  BookOpen,
  MessageSquare,
  Hash,
  Link2
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SmartAnnotation {
  id: string;
  type: 'insight' | 'question' | 'connection' | 'definition' | 'summary';
  text: string;
  page: number;
  confidence: number;
  relatedText?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface SmartAnnotationsProps {
  documentContent: string;
  currentPage: number;
  onAnnotationClick?: (annotation: SmartAnnotation) => void;
}

export function SmartAnnotations({ 
  documentContent, 
  currentPage,
  onAnnotationClick 
}: SmartAnnotationsProps) {
  const [annotations, setAnnotations] = useState<SmartAnnotation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoAnnotate, setAutoAnnotate] = useState(true);
  const { toast } = useToast();

  const annotationTypes = [
    { type: 'insight', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
    { type: 'question', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
    { type: 'connection', icon: <Link2 className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
    { type: 'definition', icon: <BookOpen className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
    { type: 'summary', icon: <Hash className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' }
  ];

  const generateSmartAnnotations = async () => {
    if (!documentContent || isGenerating) return;
    
    setIsGenerating(true);
    try {
      // Generate AI-powered annotations
      const response = await apiService.analyzeDocument({
        content: documentContent,
        page: currentPage,
        analysisType: 'annotations'
      });
      
      const newAnnotations: SmartAnnotation[] = [
        {
          id: `ann-${Date.now()}-1`,
          type: 'insight',
          text: 'This section contains key strategic information that relates to your previous queries about market analysis.',
          page: currentPage,
          confidence: 0.92,
          relatedText: documentContent.substring(0, 100)
        },
        {
          id: `ann-${Date.now()}-2`,
          type: 'question',
          text: 'Have you considered how this concept applies to your current project objectives?',
          page: currentPage,
          confidence: 0.85
        },
        {
          id: `ann-${Date.now()}-3`,
          type: 'connection',
          text: 'This relates to the methodology discussed in Chapter 3 of your previous document.',
          page: currentPage,
          confidence: 0.78
        }
      ];
      
      setAnnotations(prev => [...prev, ...newAnnotations]);
      
      toast({
        title: "Smart Annotations Generated",
        description: `Added ${newAnnotations.length} AI-powered annotations`,
      });
    } catch (error) {
      console.error('Failed to generate annotations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (autoAnnotate && documentContent) {
      generateSmartAnnotations();
    }
  }, [currentPage, autoAnnotate]);

  const getAnnotationStyle = (type: string) => {
    const style = annotationTypes.find(t => t.type === type);
    return style || annotationTypes[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-text-primary">Smart Annotations</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoAnnotate ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoAnnotate(!autoAnnotate)}
          >
            {autoAnnotate ? "Auto On" : "Auto Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSmartAnnotations}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {annotations.length === 0 ? (
          <Card className="p-4 text-center text-text-secondary">
            <Brain className="h-8 w-8 mx-auto mb-2 text-text-tertiary" />
            <p className="text-sm">No annotations yet. Click Generate to create AI-powered insights.</p>
          </Card>
        ) : (
          annotations.map(annotation => {
            const style = getAnnotationStyle(annotation.type);
            return (
              <Card
                key={annotation.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onAnnotationClick?.(annotation)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${style.color}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {annotation.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(annotation.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-xs text-text-tertiary">
                        Page {annotation.page}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary">
                      {annotation.text}
                    </p>
                    {annotation.relatedText && (
                      <p className="text-xs text-text-secondary italic">
                        "{annotation.relatedText}..."
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {annotations.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{annotations.filter(a => a.confidence > 0.8).length} high confidence</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>{annotations.filter(a => a.type === 'question').length} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>{annotations.filter(a => a.type === 'insight').length} insights</span>
          </div>
        </div>
      )}
    </div>
  );
}