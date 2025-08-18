import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Brain, 
  FileDown, 
  MessageCircle, 
  CheckCircle2, 
  Zap,
  Download,
  Eye,
  Palette,
  MousePointer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'implemented' | 'active' | 'demo';
  features: string[];
  color: string;
}

function FeatureCard({ icon, title, description, status, features, color }: FeatureCardProps) {
  const statusConfig = {
    implemented: { bg: 'bg-green-100', text: 'text-green-800', label: 'Implemented' },
    active: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active' },
    demo: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Demo Ready' }
  };

  const config = statusConfig[status];

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <Badge variant="secondary" className={`${config.bg} ${config.text}`}>
            {config.label}
          </Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function EnhancedPDFDemo() {
  const [demoStats, setDemoStats] = useState({
    highlightsGenerated: 0,
    tooltipsShown: 0,
    insightsGenerated: 0,
    pdfsDownloaded: 0
  });

  const { toast } = useToast();

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-white" />,
      title: "Smart Content Highlighting",
      description: "AI-powered intelligent highlighting with NLP analysis",
      status: 'implemented' as const,
      color: "bg-yellow-500",
      features: [
        "Key concepts highlighted in yellow",
        "Statistics and data in blue", 
        "Definitions and explanations in green",
        "Action items and conclusions in orange",
        "Contextual relevance scoring",
        "Remove duplicate page rendering",
        "NLP-based content analysis"
      ]
    },
    {
      icon: <FileDown className="h-6 w-6 text-white" />,
      title: "Downloadable Highlighted PDF",
      description: "Export PDFs with all intelligent highlights preserved",
      status: 'implemented' as const,
      color: "bg-green-500",
      features: [
        "PDF-lib integration for annotation",
        "Preserve original formatting",
        "Add highlight metadata",
        "Multiple export options",
        "Batch highlight processing",
        "Custom highlight legend",
        "High-quality output"
      ]
    },
    {
      icon: <MousePointer className="h-6 w-6 text-white" />,
      title: "Interactive Hover Tooltips",
      description: "\"Do You Know?\" popups for complex terms and concepts",
      status: 'implemented' as const,
      color: "bg-blue-500",
      features: [
        "Hover detection on text elements",
        "Contextual term definitions",
        "Related concepts linking",
        "Confidence scoring",
        "Debounced hover events",
        "Knowledge base integration",
        "Learn more functionality"
      ]
    },
    {
      icon: <Brain className="h-6 w-6 text-white" />,
      title: "AI Insights Modal",
      description: "Comprehensive document analysis in an overlay modal",
      status: 'implemented' as const,
      color: "bg-purple-500",
      features: [
        "Document summarization",
        "Key takeaways extraction",
        "Suggested questions",
        "Related topics discovery",
        "Interactive modal interface",
        "Export insights functionality",
        "Smooth animations"
      ]
    }
  ];

  const handleFeatureDemo = (featureTitle: string) => {
    switch (featureTitle) {
      case "Smart Content Highlighting":
        setDemoStats(prev => ({ ...prev, highlightsGenerated: prev.highlightsGenerated + 1 }));
        toast({
          title: "Smart Highlighting Demo",
          description: "AI has analyzed the document and applied intelligent highlights based on content type and importance.",
        });
        break;
      case "Downloadable Highlighted PDF":
        setDemoStats(prev => ({ ...prev, pdfsDownloaded: prev.pdfsDownloaded + 1 }));
        toast({
          title: "PDF Download Demo",
          description: "Highlighted PDF would be generated and downloaded with all annotations preserved.",
        });
        break;
      case "Interactive Hover Tooltips":
        setDemoStats(prev => ({ ...prev, tooltipsShown: prev.tooltipsShown + 1 }));
        toast({
          title: "Hover Tooltip Demo",
          description: "Hover over technical terms in the PDF to see contextual definitions and explanations.",
        });
        break;
      case "AI Insights Modal":
        setDemoStats(prev => ({ ...prev, insightsGenerated: prev.insightsGenerated + 1 }));
        toast({
          title: "AI Insights Demo",
          description: "AI Insights modal would open with comprehensive document analysis and recommendations.",
        });
        break;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Enhanced PDF Viewer
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience the next generation of PDF viewing with AI-powered highlighting, 
          interactive tooltips, comprehensive insights, and downloadable annotations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{demoStats.highlightsGenerated}</div>
            <div className="text-sm text-gray-600">Highlights Generated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{demoStats.tooltipsShown}</div>
            <div className="text-sm text-gray-600">Tooltips Shown</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{demoStats.insightsGenerated}</div>
            <div className="text-sm text-gray-600">Insights Generated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{demoStats.pdfsDownloaded}</div>
            <div className="text-sm text-gray-600">PDFs Downloaded</div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="relative">
            <FeatureCard {...feature} />
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFeatureDemo(feature.title)}
                className="opacity-80 hover:opacity-100"
              >
                <Eye className="h-4 w-4 mr-1" />
                Demo
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Implementation Highlights
          </CardTitle>
          <CardDescription>
            Technical details of the enhanced PDF viewer implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-yellow-700">Smart Highlighting System</h4>
              <ul className="space-y-2 text-sm">
                <li>• NLP analysis with compromise.js</li>
                <li>• Content type classification</li>
                <li>• Relevance scoring algorithm</li>
                <li>• Duplicate removal logic</li>
                <li>• Context-aware highlighting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-green-700">PDF Processing</h4>
              <ul className="space-y-2 text-sm">
                <li>• PDF-lib for annotation</li>
                <li>• Coordinate mapping system</li>
                <li>• Metadata preservation</li>
                <li>• Multi-page support</li>
                <li>• Export optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-700">Interactive Tooltips</h4>
              <ul className="space-y-2 text-sm">
                <li>• Floating UI positioning</li>
                <li>• Knowledge base integration</li>
                <li>• Hover state management</li>
                <li>• Debounced interactions</li>
                <li>• Accessibility support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-purple-700">AI Insights Modal</h4>
              <ul className="space-y-2 text-sm">
                <li>• Modal overlay system</li>
                <li>• Document analysis API</li>
                <li>• Tabbed interface</li>
                <li>• Export functionality</li>
                <li>• Loading states</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Enhanced Features</CardTitle>
          <CardDescription>
            Step-by-step guide to using the new PDF viewer capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold">Enable Smart Highlighting</h4>
                <p className="text-sm text-gray-600">
                  Click the sparkles icon in the toolbar to activate intelligent content analysis and highlighting.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold">Explore Hover Tooltips</h4>
                <p className="text-sm text-gray-600">
                  Hover over technical terms and complex concepts to see contextual definitions and explanations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold">Open AI Insights</h4>
                <p className="text-sm text-gray-600">
                  Click the brain icon to open the AI Insights modal with comprehensive document analysis.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm">
                4
              </div>
              <div>
                <h4 className="font-semibold">Download Highlighted PDF</h4>
                <p className="text-sm text-gray-600">
                  Use the download icon with highlights to export your annotated PDF with all intelligent highlights preserved.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedPDFDemo;