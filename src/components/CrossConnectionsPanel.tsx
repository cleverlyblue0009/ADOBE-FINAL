import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiService, CrossConnectionsResponse, RelatedDocument, Contradiction, CrossDocumentInsight } from '@/lib/api';
import { 
  Link2, 
  AlertTriangle, 
  Lightbulb, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface CrossConnectionsPanelProps {
  documentId: string;
  onNavigateToDocument?: (documentId: string) => void;
  className?: string;
}

export function CrossConnectionsPanel({ documentId, onNavigateToDocument, className = '' }: CrossConnectionsPanelProps) {
  const [connections, setConnections] = useState<CrossConnectionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['related']));
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, [documentId]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getCrossConnections(documentId);
      setConnections(data);
    } catch (error) {
      console.error('Failed to load cross connections:', error);
      toast({
        title: "Error",
        description: "Failed to analyze cross-connections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'complementary': return <Link2 className="h-4 w-4 text-green-600" />;
      case 'contradictory': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'similar': return <BookOpen className="h-4 w-4 text-blue-600" />;
      default: return <Link2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'complementary': return 'bg-green-100 text-green-800 border-green-200';
      case 'contradictory': return 'bg-red-100 text-red-800 border-red-200';
      case 'similar': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'opportunity': return <Target className="h-4 w-4 text-orange-600" />;
      case 'recommendation': return <Zap className="h-4 w-4 text-blue-600" />;
      default: return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Cross-Document Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Analyzing connections...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connections || (connections.related_documents.length === 0 && connections.contradictions.length === 0 && connections.insights.length === 0)) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Cross-Document Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No connections found with other documents.</p>
            <p className="text-xs text-gray-500 mt-1">Upload more documents to discover relationships.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Cross-Document Connections
        </CardTitle>
        <CardDescription>
          {connections.total_connections} connection{connections.total_connections !== 1 ? 's' : ''} found with your document library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Related Documents */}
        {connections.related_documents.length > 0 && (
          <Collapsible 
            open={expandedSections.has('related')} 
            onOpenChange={() => toggleSection('related')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Related Documents ({connections.related_documents.length})</span>
                </div>
                {expandedSections.has('related') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {connections.related_documents.map((doc, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{doc.document_title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-xs ${getConnectionTypeColor(doc.connection_type)}`}>
                            {getConnectionTypeIcon(doc.connection_type)}
                            <span className="ml-1 capitalize">{doc.connection_type}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {Math.round(doc.relevance_score * 100)}% relevance
                          </span>
                        </div>
                      </div>
                      {onNavigateToDocument && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateToDocument(doc.document_id)}
                          className="ml-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{doc.explanation}</p>
                    {doc.key_sections.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.key_sections.slice(0, 3).map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                        {doc.key_sections.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.key_sections.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Contradictions */}
        {connections.contradictions.length > 0 && (
          <Collapsible 
            open={expandedSections.has('contradictions')} 
            onOpenChange={() => toggleSection('contradictions')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Contradictions ({connections.contradictions.length})</span>
                </div>
                {expandedSections.has('contradictions') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {connections.contradictions.map((contradiction, index) => (
                <Card key={index} className="p-4 border-red-200 bg-red-50/50">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm text-red-900">{contradiction.document_title}</h4>
                      <Badge variant="secondary" className={`text-xs ${getSeverityColor(contradiction.severity)}`}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {contradiction.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-800 leading-relaxed">{contradiction.contradiction}</p>
                    {onNavigateToDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToDocument(contradiction.document_id)}
                        className="mt-2 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Review Document
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Cross-Document Insights */}
        {connections.insights.length > 0 && (
          <Collapsible 
            open={expandedSections.has('insights')} 
            onOpenChange={() => toggleSection('insights')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">AI Insights ({connections.insights.length})</span>
                </div>
                {expandedSections.has('insights') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {connections.insights.map((insight, index) => (
                <Card key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {insight.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{insight.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}