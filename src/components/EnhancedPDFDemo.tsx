import React, { useState } from 'react';
import { CustomPDFViewer } from './CustomPDFViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Brain, 
  Download, 
  MessageCircle, 
  Lightbulb,
  FileText,
  CheckCircle
} from 'lucide-react';

export function EnhancedPDFDemo() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  
  // Sample PDF URL - you can replace this with any PDF URL
  const samplePdfUrl = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
  const documentName = "Enhanced PDF Viewer Demo";

  const features = [
    {
      id: 'smart-highlighting',
      title: 'Smart Content Highlighting',
      description: 'AI-powered text analysis with color-coded highlights',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-yellow-500',
      details: [
        'Key concepts highlighted in yellow',
        'Statistical data in blue',
        'Definitions in green', 
        'Action items in orange',
        'Contextual importance scoring'
      ]
    },
    {
      id: 'hover-tooltips',
      title: 'Interactive Hover Tooltips',
      description: '"Do You Know?" popups for complex terms',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-blue-500',
      details: [
        'Automatic term detection',
        'Contextual definitions',
        'Related concepts',
        'External learning links',
        'Debounced hover prevention'
      ]
    },
    {
      id: 'ai-insights-modal',
      title: 'AI Insights Modal',
      description: 'Comprehensive document analysis in modal overlay',
      icon: <Brain className="w-5 h-5" />,
      color: 'bg-purple-500',
      details: [
        'Document summary generation',
        'Key takeaways extraction',
        'Suggested questions',
        'Topic identification',
        'Interactive navigation'
      ]
    },
    {
      id: 'download-highlights',
      title: 'Downloadable Highlighted PDF',
      description: 'Export PDF with all highlights preserved',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-green-500',
      details: [
        'PDF-lib integration',
        'Highlight preservation',
        'Metadata inclusion',
        'Color-coded annotations',
        'Summary generation'
      ]
    }
  ];

  const handleTextSelection = (text: string, page: number) => {
    console.log(`Text selected on page ${page}:`, text);
  };

  const handlePageChange = (page: number) => {
    console.log(`Navigated to page ${page}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Enhanced PDF Viewer Demo
          </h1>
          <p className="text-text-secondary">
            Experience the next generation of PDF reading with AI-powered features
          </p>
        </div>

        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="features">Feature Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  PDF Viewer with Enhanced Features
                </CardTitle>
                <CardDescription>
                  The PDF viewer below includes all enhanced features. Try hovering over text, 
                  clicking the sparkles icon for smart highlights, or the brain icon for AI insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[800px] border border-border-subtle rounded-lg overflow-hidden">
                  <CustomPDFViewer
                    documentUrl={samplePdfUrl}
                    documentName={documentName}
                    onTextSelection={handleTextSelection}
                    onPageChange={handlePageChange}
                    enableSmartHighlighting={true}
                    enableHoverTooltips={true}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <Card 
                  key={feature.id} 
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setSelectedFeature(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${feature.color} text-white`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card key={feature.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${feature.color} text-white`}>
                        {feature.icon}
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Smart Highlighting</h4>
                    <p className="text-sm text-text-secondary mb-2">
                      Click the sparkles (✨) icon in the toolbar to generate AI-powered highlights
                    </p>
                    <Badge variant="outline">Auto-generated on page load</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Hover Tooltips</h4>
                    <p className="text-sm text-text-secondary mb-2">
                      Hover over technical terms to see "Do You Know?" definitions
                    </p>
                    <Badge variant="outline">Always enabled</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">AI Insights</h4>
                    <p className="text-sm text-text-secondary mb-2">
                      Click the brain (🧠) icon to open comprehensive document analysis
                    </p>
                    <Badge variant="outline">Modal overlay</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Download Highlights</h4>
                    <p className="text-sm text-text-secondary mb-2">
                      Click the download icon to export PDF with preserved highlights
                    </p>
                    <Badge variant="outline">PDF-lib powered</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}