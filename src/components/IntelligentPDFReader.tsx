import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  BookOpen,
  Lightbulb,
  Star,
  FileText
} from 'lucide-react';
import { PDFHighlighter, createPDFHighlighter, type HighlightPosition, type PhraseMatch } from '@/lib/pdfHighlighter';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Types for highlights and flashcards
interface Highlight {
  id: string;
  text: string;
  position: HighlightPosition;
  category: "primary" | "secondary" | "tertiary";
  pageNumber: number;
}

interface Flashcard {
  id: string;
  text: string;
  category: "primary" | "secondary" | "tertiary";
  aiNotes?: string;
  pageNumber: number;
}

interface AIAnalysisResult {
  phrases: Array<{
    text: string;
    category: "primary" | "secondary" | "tertiary";
    pageNumber: number;
    confidence: number;
  }>;
  headings: Array<{
    text: string;
    pageNumber: number;
    level: number;
  }>;
}

interface IntelligentPDFReaderProps {
  onUpload?: (file: File) => void;
  className?: string;
}

export const IntelligentPDFReader: React.FC<IntelligentPDFReaderProps> = ({ 
  onUpload, 
  className 
}) => {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());
  const [pdfHighlighter, setPdfHighlighter] = useState<PDFHighlighter | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<any>(null);
  const pageRefs = useRef<Map<number, any>>(new Map());
  
  const { toast } = useToast();

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setHighlights([]);
      setFlashcards([]);
      setPageTexts(new Map());
      setPageNumber(1);
      onUpload?.(selectedFile);
      toast({
        title: "PDF Uploaded",
        description: "Starting AI analysis...",
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  }, [onUpload, toast]);

  // Document load success handler
  const onDocumentLoadSuccess = useCallback(async (document: any) => {
    setNumPages(document.numPages);
    setIsLoading(false);
    documentRef.current = document;
    
    // Create PDF highlighter instance
    const highlighter = createPDFHighlighter(document);
    setPdfHighlighter(highlighter);
    
    if (file) {
      // Start AI analysis after document loads
      await performAIAnalysis(document, highlighter);
    }
  }, [file]);

  // Extract text from all pages using highlighter
  const extractAllPageTexts = useCallback(async (highlighter: PDFHighlighter): Promise<Map<number, string>> => {
    const texts = new Map<number, string>();
    
    try {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const pageText = await highlighter.getPageTextString(pageNum);
        if (pageText) {
          texts.set(pageNum, pageText);
        }
      }
    } catch (error) {
      console.error('Error extracting page texts:', error);
      toast({
        title: "Text Extraction Error",
        description: "Failed to extract text from PDF pages.",
        variant: "destructive",
      });
    }
    
    return texts;
  }, [numPages, toast]);

  // Perform AI analysis
  const performAIAnalysis = useCallback(async (document: any, highlighter: PDFHighlighter) => {
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      // First extract all page texts
      const texts = await extractAllPageTexts(highlighter);
      setPageTexts(texts);
      
      // Upload PDF and get AI analysis
      const formData = new FormData();
      formData.append('files', file);
      formData.append('persona', 'student');
      formData.append('job_to_be_done', 'learning and understanding');

      // Use the backend API endpoint
      const uploadResponse = await fetch('http://localhost:8000/upload-pdfs', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const documents = await uploadResponse.json();
      const documentId = documents[0]?.id;

      if (!documentId) {
        throw new Error('No document ID received');
      }

      // Get AI analysis
      const analysisResponse = await fetch('http://localhost:8000/analyze-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_ids: [documentId],
          persona: 'student',
          job_to_be_done: 'learning and understanding',
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to get AI analysis');
      }

      const analysisData = await analysisResponse.json();
      
      // Process analysis results and create highlights
      await processAnalysisResults(analysisData, texts, highlighter);
      
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Could not complete AI analysis. Using fallback highlighting.",
        variant: "destructive",
      });
      
      // Fallback to local analysis
      await performFallbackAnalysis(highlighter, texts);
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, extractAllPageTexts, toast]);

  // Process AI analysis results and create highlights
  const processAnalysisResults = useCallback(async (
    analysisData: any, 
    pageTexts: Map<number, string>,
    highlighter: PDFHighlighter
  ) => {
    const newHighlights: Highlight[] = [];
    const newFlashcards: Flashcard[] = [];

    // Process different types of content from the analysis
    if (analysisData.sections) {
      for (const section of analysisData.sections) {
        const pageNum = section.page || 1;
        const pageText = pageTexts.get(pageNum);
        
        if (!pageText) continue;

        // Create highlights for important phrases in the section
        const phrases = PDFHighlighter.extractImportantPhrases(section.text, section.heading);
        
        // Convert to PhraseMatch format
        const phraseMatches: PhraseMatch[] = phrases.map(phrase => ({
          phrase: phrase.phrase,
          startIndex: phrase.startIndex,
          endIndex: phrase.endIndex,
          confidence: phrase.confidence,
          category: phrase.category
        }));
        
        // Find positions using the highlighter
        const positions = await highlighter.findPhrasesInPage(pageNum, phraseMatches);
        
        for (const position of positions) {
          const matchingPhrase = phraseMatches.find(p => 
            position.text.toLowerCase().includes(p.phrase.toLowerCase()) ||
            p.phrase.toLowerCase().includes(position.text.toLowerCase())
          );
          
          if (matchingPhrase) {
            const highlight: Highlight = {
              id: `highlight-${Date.now()}-${Math.random()}`,
              text: position.text,
              position,
              category: matchingPhrase.category,
              pageNumber: pageNum,
            };
            
            newHighlights.push(highlight);
            
            // Create corresponding flashcard
            const flashcard: Flashcard = {
              id: `flashcard-${highlight.id}`,
              text: position.text,
              category: matchingPhrase.category,
              pageNumber: pageNum,
              aiNotes: await generateAINotes(position.text, section.text),
            };
            
            newFlashcards.push(flashcard);
          }
        }
      }
    }

    setHighlights(newHighlights);
    setFlashcards(newFlashcards);
    
    toast({
      title: "AI Analysis Complete",
      description: `Generated ${newHighlights.length} highlights and ${newFlashcards.length} flashcards.`,
    });
  }, [toast]);

  // Fallback analysis using local logic
  const performFallbackAnalysis = useCallback(async (
    highlighter: PDFHighlighter,
    pageTexts: Map<number, string>
  ) => {
    const newHighlights: Highlight[] = [];
    const newFlashcards: Flashcard[] = [];

    // Analyze each page locally
    for (const [pageNum, pageText] of pageTexts.entries()) {
      const phrases = PDFHighlighter.extractImportantPhrases(pageText);
      
      // Convert to PhraseMatch format
      const phraseMatches: PhraseMatch[] = phrases.map(phrase => ({
        phrase: phrase.phrase,
        startIndex: phrase.startIndex,
        endIndex: phrase.endIndex,
        confidence: phrase.confidence,
        category: phrase.category
      }));
      
      // Find positions using the highlighter
      const positions = await highlighter.findPhrasesInPage(pageNum, phraseMatches);
      
      for (const position of positions) {
        const matchingPhrase = phraseMatches.find(p => 
          position.text.toLowerCase().includes(p.phrase.toLowerCase()) ||
          p.phrase.toLowerCase().includes(position.text.toLowerCase())
        );
        
        if (matchingPhrase) {
          const highlight: Highlight = {
            id: `highlight-${Date.now()}-${Math.random()}`,
            text: position.text,
            position,
            category: matchingPhrase.category,
            pageNumber: pageNum,
          };
          
          newHighlights.push(highlight);
          
          // Create corresponding flashcard
          const flashcard: Flashcard = {
            id: `flashcard-${highlight.id}`,
            text: position.text,
            category: matchingPhrase.category,
            pageNumber: pageNum,
            aiNotes: `Local analysis: This ${matchingPhrase.category} content was identified based on keyword patterns.`,
          };
          
          newFlashcards.push(flashcard);
        }
      }
    }

    setHighlights(newHighlights);
    setFlashcards(newFlashcards);
    
    toast({
      title: "Local Analysis Complete",
      description: `Generated ${newHighlights.length} highlights and ${newFlashcards.length} flashcards using fallback analysis.`,
    });
  }, [toast]);



  // Generate AI notes for flashcard
  const generateAINotes = useCallback(async (phrase: string, context: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:8000/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: phrase,
          persona: 'student',
          job_to_be_done: 'learning and understanding',
          document_context: context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.insights || '';
      }
    } catch (error) {
      console.error('Error generating AI notes:', error);
    }
    
    return `Key insight: ${phrase.length > 100 ? phrase.substring(0, 100) + '...' : phrase}`;
  }, []);

  // Navigation handlers
  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  // Render highlights on page
  const renderHighlights = useCallback((pageNum: number) => {
    const pageHighlights = highlights.filter(h => h.pageNumber === pageNum);
    
    return pageHighlights.map(highlight => (
      <div key={highlight.id} className="absolute">
        {/* Render individual text rectangles for better precision */}
        {highlight.position.rects.map((rect, index) => (
          <div
            key={`${highlight.id}-${index}`}
            className={`absolute pointer-events-none rounded-sm ${
              highlight.category === 'primary' ? 'bg-yellow-300' :
              highlight.category === 'secondary' ? 'bg-blue-200' :
              'bg-green-200'
            } opacity-40 hover:opacity-60 transition-opacity`}
            style={{
              left: `${rect.x1 * scale}px`,
              top: `${rect.y1 * scale}px`,
              width: `${rect.width * scale}px`,
              height: `${rect.height * scale}px`,
            }}
            title={`${highlight.category.toUpperCase()}: ${highlight.text}`}
          />
        ))}
        
        {/* Optional: Add a subtle border around the entire highlight */}
        <div
          className={`absolute pointer-events-none border-2 rounded ${
            highlight.category === 'primary' ? 'border-yellow-400' :
            highlight.category === 'secondary' ? 'border-blue-300' :
            'border-green-300'
          } opacity-30`}
          style={{
            left: `${highlight.position.boundingRect.x1 * scale}px`,
            top: `${highlight.position.boundingRect.y1 * scale}px`,
            width: `${highlight.position.boundingRect.width * scale}px`,
            height: `${highlight.position.boundingRect.height * scale}px`,
          }}
        />
      </div>
    ));
  }, [highlights, scale]);

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {file && (
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {file.name}
              </span>
            )}
          </div>

          {file && (
            <div className="flex items-center gap-2">
              <Button onClick={zoomOut} variant="outline" size="sm">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button onClick={zoomIn} variant="outline" size="sm">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* PDF Content */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto bg-gray-100">
          {!file ? (
            <div className="text-center p-8">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No PDF Selected
              </h3>
              <p className="text-gray-500 mb-4">
                Upload a PDF to start intelligent analysis and highlighting
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose PDF File
              </Button>
            </div>
          ) : (
            <div className="relative">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Analyzing PDF with AI...</p>
                  </div>
                </div>
              )}
              
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadStart={() => setIsLoading(true)}
                onLoadError={(error) => {
                  setIsLoading(false);
                  toast({
                    title: "PDF Load Error",
                    description: "Failed to load PDF file.",
                    variant: "destructive",
                  });
                }}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                }
              >
                <div className="relative">
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    }
                  />
                  {/* Render highlights overlay */}
                  {renderHighlights(pageNumber)}
                </div>
              </Document>
            </div>
          )}
        </div>

        {/* Navigation */}
        {file && numPages > 0 && (
          <div className="bg-white border-t p-4 flex items-center justify-center gap-4">
            <Button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages}
            </span>
            
            <Button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Flashcards Sidebar */}
      <div className="w-80 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Flashcards
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {flashcards.length} cards generated from highlights
          </p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          {flashcards.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Upload a PDF to generate intelligent flashcards
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flashcards.map((card) => (
                <Card key={card.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={
                          card.category === 'primary' ? 'default' :
                          card.category === 'secondary' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {card.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Page {card.pageNumber}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-2 line-clamp-3">
                      {card.text}
                    </p>
                    {card.aiNotes && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {card.aiNotes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default IntelligentPDFReader;