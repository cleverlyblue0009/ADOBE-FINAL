import React, { useState } from 'react';
import { InteractivePDFViewer } from '@/components/InteractivePDFViewer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  highlightManager, 
  type Highlight,
  type AIInsight 
} from '@/lib/pdfHighlightManager';
import { 
  FileText, 
  Highlighter, 
  Brain, 
  Download, 
  Upload,
  Trash2,
  Eye
} from 'lucide-react';

export default function PDFDemo() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('');
  const [showStats, setShowStats] = useState(true);
  const { toast } = useToast();

  // Handle highlight creation
  const handleHighlightCreated = (highlight: Highlight) => {
    setHighlights(prev => [...prev, highlight]);
    toast({
      title: "Highlight Added",
      description: `"${highlight.text.substring(0, 50)}${highlight.text.length > 50 ? '...' : ''}"`,
    });
  };

  // AI insights function that analyzes actual document text
  const handleAIInsightRequest = async (text: string): Promise<string> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate contextual insights from the actual text content
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyTerms = extractKeyTerms(text);
    
    // Analyze text complexity and content type
    const wordCount = words.length;
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
    const complexity = avgWordsPerSentence > 20 ? 'complex' : avgWordsPerSentence > 12 ? 'moderate' : 'simple';
    
    // Generate contextual insight based on content analysis
    if (keyTerms.length > 0) {
      const mainConcept = keyTerms[0];
      const supportingConcepts = keyTerms.slice(1, 3).join(' and ');
      
      if (text.toLowerCase().includes('research') || text.toLowerCase().includes('study')) {
        return `This ${complexity} passage presents research findings about ${mainConcept}${supportingConcepts ? ` and ${supportingConcepts}` : ''}. The content provides evidence-based insights that could inform decision-making and further investigation.`;
      }
      
      if (text.toLowerCase().includes('method') || text.toLowerCase().includes('process')) {
        return `This text outlines a ${complexity} methodology related to ${mainConcept}. Understanding this process${supportingConcepts ? ` and its relationship to ${supportingConcepts}` : ''} is crucial for practical implementation.`;
      }
      
      if (text.toLowerCase().includes('analysis') || text.toLowerCase().includes('conclusion')) {
        return `This analytical passage examines ${mainConcept}${supportingConcepts ? ` in relation to ${supportingConcepts}` : ''}. The insights presented here synthesize key findings and suggest important implications for the field.`;
      }
      
      return `This ${wordCount}-word excerpt focuses on ${mainConcept}${supportingConcepts ? `, ${supportingConcepts}` : ''}. The ${complexity} language and ${sentences.length} key points suggest this is ${sentences.length > 3 ? 'a comprehensive overview' : 'a focused explanation'} that merits careful consideration.`;
    }
    
    return `This ${complexity} passage contains ${sentences.length} key points across ${wordCount} words. The content provides important context that contributes to understanding the document's main themes and objectives.`;
  };

  // Extract key terms from text for contextual analysis
  const extractKeyTerms = (text: string): string[] => {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    const wordFreq = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  // Export highlights
  const exportHighlights = () => {
    if (!currentDocumentId) {
      toast({
        title: "No Document",
        description: "Please load a PDF first",
        variant: "destructive",
      });
      return;
    }

    const highlightsJson = highlightManager.exportHighlights(currentDocumentId);
    const blob = new Blob([highlightsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlights-${currentDocumentId.split('-')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Highlights Exported",
      description: "Your highlights have been downloaded as JSON",
    });
  };

  // Clear all highlights
  const clearHighlights = () => {
    if (!currentDocumentId) return;

    highlightManager.clearDocument(currentDocumentId);
    setHighlights([]);
    toast({
      title: "Highlights Cleared",
      description: "All highlights have been removed",
    });
  };

  // Get document stats
  const getDocumentStats = () => {
    if (!currentDocumentId) return null;

    const docHighlights = highlightManager.getHighlights(currentDocumentId);
    const docInsights = highlightManager.getInsights(currentDocumentId);
    
    return {
      highlights: docHighlights.length,
      insights: docInsights.length,
      pages: [...new Set(docHighlights.map(h => h.page))].length,
    };
  };

  const stats = getDocumentStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Interactive PDF Viewer Demo
              </h1>
              <p className="mt-2 text-gray-600">
                Upload a PDF to experience highlighting and AI insights
              </p>
            </div>
            
            {stats && showStats && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Highlighter className="w-3 h-3" />
                    {stats.highlights} Highlights
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {stats.insights} Insights
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {stats.pages} Pages
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={exportHighlights} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={clearHighlights} variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Highlighter className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Text Highlighting</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Select any text in the PDF to create persistent highlights. All highlights are automatically saved and restored when you reload the document.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">AI Insights</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get instant AI-powered analysis of selected text. Insights are cached locally for quick access and appear in the side panel.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Native Text Layer</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Uses PDF.js native text layer for perfect text selection and rendering. No blurry overlays or duplicated content.
            </p>
          </Card>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="h-[calc(100vh-300px)]">
        <InteractivePDFViewer
          documentId={currentDocumentId}
          onHighlightCreated={handleHighlightCreated}
          onAIInsightRequested={handleAIInsightRequest}
          className="h-full"
        />
      </div>

      {/* Instructions */}
      {!currentDocumentId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-4">Get Started</h3>
            <div className="max-w-2xl mx-auto space-y-4 text-gray-600">
              <p>
                <strong>1. Upload a PDF:</strong> Click the "Upload PDF" button in the viewer above to select a PDF file from your computer.
              </p>
              <p>
                <strong>2. Select Text:</strong> Click and drag to select any text in the PDF. A tooltip will appear with highlighting and AI insight options.
              </p>
              <p>
                <strong>3. Create Highlights:</strong> Click "Highlight" to permanently mark important text with a yellow background.
              </p>
              <p>
                <strong>4. Get AI Insights:</strong> Click "AI Insights" to get intelligent analysis of the selected text in the side panel.
              </p>
              <p>
                <strong>5. Navigate:</strong> Use the toolbar controls to zoom, rotate, and navigate through pages.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}