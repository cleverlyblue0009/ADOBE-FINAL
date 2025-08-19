import React from 'react';
import { IntelligentPDFReader } from '@/components/IntelligentPDFReader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Zap, Target, Brain } from 'lucide-react';

const IntelligentPDFDemo: React.FC = () => {
  const handleFileUpload = (file: File) => {
    console.log('PDF uploaded:', file.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                Intelligent PDF Reader
              </h1>
              <p className="text-gray-600 mt-2">
                AI-powered PDF analysis with textbook-style highlights and flashcards
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Smart Highlights
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                PDF Rendering
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600">
              Native PDF.js integration with precise text layer highlighting
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                Smart Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600">
              AI identifies important phrases, headings, and key concepts automatically
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                Interactive Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600">
              Generate flashcards from highlights with AI-powered insights
            </CardContent>
          </Card>
        </div>

        {/* Color Legend */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Highlight Categories</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-300 rounded border"></div>
              <span className="text-sm text-gray-700">Primary - Key concepts, definitions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded border"></div>
              <span className="text-sm text-gray-700">Secondary - Important facts, processes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded border"></div>
              <span className="text-sm text-gray-700">Tertiary - Supporting information, examples</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main PDF Reader */}
      <div className="h-[calc(100vh-280px)]">
        <IntelligentPDFReader 
          onUpload={handleFileUpload}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default IntelligentPDFDemo;