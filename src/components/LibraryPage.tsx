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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your document library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  Document Library
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and analyze your uploaded documents
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {documents.length} total documents
              </p>
              <p className="text-sm text-gray-500">
                {selectedDocuments.size} selected
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All personas</SelectItem>
                  {personas.map(persona => (
                    <SelectItem key={persona} value={persona}>
                      {persona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All jobs</SelectItem>
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Analyze Selected ({selectedDocuments.size})
              </Button>
            </div>
          </div>
        </div>

        {/* Document Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
            </h3>
            <p className="text-gray-500">
              {documents.length === 0 
                ? 'Upload your first PDF to get started with intelligent document analysis.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card 
                key={doc.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  selectedDocuments.has(doc.id) 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleDocumentToggle(doc.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {doc.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-sm text-gray-500">
                    {doc.name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Persona and Job badges */}
                    <div className="flex flex-wrap gap-2">
                      {doc.persona && (
                        <Badge variant="secondary" className={getPersonaColor(doc.persona)}>
                          <User className="h-3 w-3 mr-1" />
                          {doc.persona}
                        </Badge>
                      )}
                      {doc.job_to_be_done && (
                        <Badge variant="secondary" className={getJobColor(doc.job_to_be_done)}>
                          <Target className="h-3 w-3 mr-1" />
                          {doc.job_to_be_done}
                        </Badge>
                      )}
                    </div>

                    {/* Document info */}
                    <div className="text-xs text-gray-500 space-y-1">
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
                      <div className="flex items-center justify-center py-2 bg-blue-50 rounded-md">
                        <span className="text-blue-600 text-sm font-medium">✓ Selected</span>
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