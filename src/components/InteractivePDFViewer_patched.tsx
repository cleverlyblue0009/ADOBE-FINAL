import React, { useEffect, useState } from "react";
import CustomPDFViewer from "./CustomPDFViewer";

interface IntelligentHighlight {
  text: string;
  color?: string;
  importance?: 'high' | 'medium' | 'low';
  category?: 'definition' | 'concept' | 'example' | 'key-point';
}

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  highlight: IntelligentHighlight;
  pageNumber: number;
}

const InteractivePDFViewer: React.FC = () => {
  const [intelligentHighlights, setIntelligentHighlights] = useState<IntelligentHighlight[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [pdfUrl, setPdfUrl] = useState("/uploads/mypdf.pdf");

  // Simulate fetching intelligent highlights from backend AI
  useEffect(() => {
    async function fetchIntelligentHighlights() {
      try {
        const res = await fetch("/api/highlights"); // your backend endpoint
        if (res.ok) {
          const data = await res.json();
          // Expect: [{ text: "Mediterranean coastline", color: "yellow", importance: "high", category: "concept" }, ...]
          setIntelligentHighlights(data);
        }
      } catch (error) {
        console.error('Error fetching highlights:', error);
        // Fallback to sample highlights for demo
        setIntelligentHighlights([
          {
            text: "Mediterranean coastline",
            color: "yellow",
            importance: "high",
            category: "concept"
          },
          {
            text: "photosynthesis",
            color: "#90EE90",
            importance: "high",
            category: "definition"
          },
          {
            text: "economic growth",
            color: "#FFB6C1",
            importance: "medium",
            category: "key-point"
          }
        ]);
      }
    }
    fetchIntelligentHighlights();
  }, []);

  // Handle flashcard generation from highlights
  const handleFlashcardGenerated = (flashcard: FlashcardData) => {
    setFlashcards(prev => [...prev, flashcard]);
  };

  // Generate AI-powered flashcard content
  const generateAIFlashcard = async (highlight: IntelligentHighlight, pageNumber: number): Promise<FlashcardData> => {
    try {
      const response = await fetch('/api/generate-flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: highlight.text,
          category: highlight.category,
          importance: highlight.importance,
          pageNumber
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: `flashcard-${Date.now()}-${Math.random()}`,
          question: data.question,
          answer: data.answer,
          highlight,
          pageNumber
        };
      }
    } catch (error) {
      console.error('Error generating AI flashcard:', error);
    }

    // Fallback flashcard generation
    return {
      id: `flashcard-${Date.now()}-${Math.random()}`,
      question: generateQuestionFromHighlight(highlight),
      answer: generateAnswerFromHighlight(highlight),
      highlight,
      pageNumber
    };
  };

  // Fallback question generation
  const generateQuestionFromHighlight = (highlight: IntelligentHighlight): string => {
    switch (highlight.category) {
      case 'definition':
        return `What is ${highlight.text}?`;
      case 'concept':
        return `Explain the concept of ${highlight.text}.`;
      case 'example':
        return `What does this example demonstrate: ${highlight.text}?`;
      case 'key-point':
        return `Why is this important: ${highlight.text}?`;
      default:
        return `What is the significance of: ${highlight.text}?`;
    }
  };

  // Fallback answer generation
  const generateAnswerFromHighlight = (highlight: IntelligentHighlight): string => {
    const importance = highlight.importance || 'important';
    const category = highlight.category || 'concept';
    
    return `This ${category} "${highlight.text}" is highlighted as ${importance} content in the document. It represents a key learning point that should be understood and remembered.`;
  };

  return (
    <div className="interactive-pdf-viewer flex h-screen">
      {/* PDF viewer with textbook-style highlights */}
      <div className="pdf-container flex-1">
        <CustomPDFViewer 
          documentUrl={pdfUrl} 
          documentName="Interactive PDF"
          intelligentHighlights={intelligentHighlights}
          onFlashcardGenerated={handleFlashcardGenerated}
        />
      </div>

      {/* Flashcards panel synced with highlights */}
      <div className="flashcard-panel w-1/3 p-4 border-l bg-white overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          📚 Smart Flashcards
        </h2>
        
        {/* Intelligent Highlights Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            🔍 Intelligent Highlights
          </h3>
          {intelligentHighlights.map((hl, i) => (
            <div
              key={i}
              className="bg-gray-50 shadow-sm rounded-lg p-3 mb-3 cursor-pointer hover:bg-gray-100 transition-colors border-l-4"
              style={{ borderLeftColor: hl.color || 'yellow' }}
              onClick={() => generateAIFlashcard(hl, 1).then(handleFlashcardGenerated)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  hl.importance === 'high' ? 'bg-red-100 text-red-800' :
                  hl.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {hl.importance} importance
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {hl.category}
                </span>
              </div>
              <p className="font-medium text-gray-800">{hl.text}</p>
              <p className="text-xs text-gray-600 mt-1">
                Click to generate flashcard
              </p>
            </div>
          ))}
        </div>

        {/* Generated Flashcards */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            🎴 Generated Flashcards ({flashcards.length})
          </h3>
          {flashcards.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <p>Click on highlighted text or highlights above to generate flashcards!</p>
            </div>
          ) : (
            flashcards.map((flashcard, i) => (
              <div
                key={flashcard.id}
                className="bg-white shadow-md rounded-lg p-4 mb-4 border hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Page {flashcard.pageNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    #{i + 1}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="font-semibold text-gray-800 mb-2">Q:</p>
                  <p className="text-gray-700">{flashcard.question}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800 mb-2">A:</p>
                  <p className="text-gray-600 text-sm">{flashcard.answer}</p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>Source:</strong> "{flashcard.highlight.text}"
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractivePDFViewer;