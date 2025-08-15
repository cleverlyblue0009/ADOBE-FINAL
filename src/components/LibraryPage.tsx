import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService, DocumentInfo } from '@/lib/api';
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  User, 
  Target, 
  BookOpen, 
  Trash2, 
  Eye,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface LibraryPageProps {
  onDocumentSelect: (documents: DocumentInfo[], persona: string, jobToBeDone: string) => void;
  onBack: () => void;
}

export function LibraryPage({ onDocumentSelect, onBack }: LibraryPageProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [personas, setPersonas] = useState<string[]>([]);
  const [jobs, setJobs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadLibraryData();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedPersona, selectedJob]);

  const loadLibraryData = async () => {
    try {
      setIsLoading(true);
      const [docsData, personasData, jobsData] = await Promise.all([
        apiService.getLibraryDocuments(),
        apiService.getPersonas(),
        apiService.getJobs()
      ]);
      
      setDocuments(docsData);
      setPersonas(personasData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load library data:', error);
      toast({
        title: "Error",
        description: "Failed to load your document library. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by persona
    if (selectedPersona) {
      filtered = filtered.filter(doc => doc.persona === selectedPersona);
    }

    // Filter by job
    if (selectedJob) {
      filtered = filtered.filter(doc => doc.job_to_be_done === selectedJob);
    }

    setFilteredDocuments(filtered);
  };

  const handleDocumentToggle = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleAnalyzeSelected = () => {
    if (selectedDocuments.size === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to analyze.",
        variant: "destructive"
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    
    // Use the most common persona and job from selected documents
    const personaCount = new Map<string, number>();
    const jobCount = new Map<string, number>();
    
    selectedDocs.forEach(doc => {
      if (doc.persona) {
        personaCount.set(doc.persona, (personaCount.get(doc.persona) || 0) + 1);
      }
      if (doc.job_to_be_done) {
        jobCount.set(doc.job_to_be_done, (jobCount.get(doc.job_to_be_done) || 0) + 1);
      }
    });

    const mostCommonPersona = Array.from(personaCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const mostCommonJob = Array.from(jobCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    onDocumentSelect(selectedDocs, mostCommonPersona, mostCommonJob);
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await apiService.deleteDocument(docId);
      setDocuments(docs => docs.filter(doc => doc.id !== docId));
      setSelectedDocuments(selected => {
        const newSelected = new Set(selected);
        newSelected.delete(docId);
        return newSelected;
      });
      toast({
        title: "Success",
        description: "Document deleted successfully."
      });
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPersonaColor = (persona: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    const index = persona.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getJobColor = (job: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-800',
      'bg-cyan-100 text-cyan-800',
      'bg-rose-100 text-rose-800',
      'bg-amber-100 text-amber-800',
      'bg-violet-100 text-violet-800',
      'bg-teal-100 text-teal-800'
    ];
    const index = job.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-full blur-xl"></div>
            <div className="relative w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center border border-border-subtle">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          </div>
          <p className="text-text-secondary font-medium">Loading your document library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2 hover:bg-surface-hover"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-black text-text-primary flex items-center gap-3 font-display">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full flex items-center justify-center">
                      <Eye className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  Document Library
                </h1>
                <p className="text-text-secondary mt-1 font-medium">
                  Manage and analyze your uploaded documents
                </p>
              </div>
            </div>
            <div className="text-right bg-surface-elevated/80 backdrop-blur-sm rounded-lg p-4 border border-border-subtle">
              <p className="text-sm text-text-secondary font-medium">
                <span className="text-brand-primary font-bold">{documents.length}</span> total documents
              </p>
              <p className="text-sm text-text-secondary font-medium">
                <span className="text-brand-secondary font-bold">{selectedDocuments.size}</span> selected
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-surface-elevated/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-surface-elevated border-border-subtle focus:border-brand-primary focus:ring-brand-primary/20"
                />
              </div>
              
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger className="bg-surface-elevated border-border-subtle focus:border-brand-primary">
                  <SelectValue placeholder="Filter by persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All personas</SelectItem>
                  {personas.map(persona => (
                    <SelectItem key={persona} value={persona}>
                      {persona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="bg-surface-elevated border-border-subtle focus:border-brand-primary">
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job} value={job}>
                      {job}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAnalyzeSelected}
                disabled={selectedDocuments.size === 0}
                className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-4 w-4 mr-2" />
                Analyze Selected ({selectedDocuments.size})
              </Button>
            </div>
          </div>
        </div>

        {/* Document Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-full blur-xl"></div>
              <div className="relative w-24 h-24 bg-surface-elevated rounded-full flex items-center justify-center border border-border-subtle">
                <FileText className="h-8 w-8 text-text-tertiary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3 font-display">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
            </h3>
            <p className="text-text-secondary max-w-md mx-auto">
              {documents.length === 0 
                ? 'Upload your first PDF to get started with intelligent document analysis.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDocuments.map((doc, index) => (
              <Card 
                key={doc.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-surface-elevated/80 backdrop-blur-sm border-border-subtle ${
                  selectedDocuments.has(doc.id) 
                    ? 'ring-2 ring-brand-primary shadow-2xl bg-brand-primary/5 border-brand-primary/30' 
                    : 'hover:shadow-xl hover:border-brand-primary/20'
                }`}
                onClick={() => handleDocumentToggle(doc.id)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex-1 text-text-primary font-bold group-hover:text-brand-primary transition-colors">
                      {doc.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error-dark hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-sm text-text-secondary font-medium">
                    {doc.name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Persona and Job badges */}
                    <div className="flex flex-wrap gap-2">
                      {doc.persona && (
                        <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20">
                          <User className="h-3 w-3 mr-1" />
                          {doc.persona}
                        </Badge>
                      )}
                      {doc.job_to_be_done && (
                        <Badge variant="secondary" className="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 hover:bg-brand-secondary/20">
                          <Target className="h-3 w-3 mr-1" />
                          {doc.job_to_be_done}
                        </Badge>
                      )}
                    </div>

                    {/* Document info */}
                    <div className="text-xs text-text-tertiary space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.upload_timestamp)}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {doc.language} • {doc.outline.length} sections
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedDocuments.has(doc.id) && (
                      <div className="flex items-center justify-center py-3 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-lg border border-brand-primary/20">
                        <span className="text-brand-primary text-sm font-bold">✓ Selected</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}