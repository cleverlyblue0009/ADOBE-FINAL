import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService, DocumentInfo } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { 
  Upload, 
  Brain, 
  Mic, 
  Eye, 
  Clock, 
  BookOpen,
  Accessibility,
  Palette,
  Volume2,
  Loader2,
  Library,
  Sparkles,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onStart: (documents: DocumentInfo[], persona: string, jobToBeDone: string) => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [persona, setPersona] = useState('');
  const [jobToBeDone, setJobToBeDone] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFeatureDemo, setShowFeatureDemo] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleStart = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!persona.trim() || !jobToBeDone.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both your role and what you want to accomplish.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDocuments = await apiService.uploadPDFs(selectedFiles, persona, jobToBeDone);
      
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${uploadedDocuments.length} document(s).`
      });
      
      onStart(uploadedDocuments, persona, jobToBeDone);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload and process PDFs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeatureClick = (feature: string) => {
    setShowFeatureDemo(feature);
    toast({
      title: `${feature.charAt(0).toUpperCase() + feature.slice(1)} Feature`,
      description: `Learn how to use ${feature} after uploading a PDF and starting your reading session.`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border-subtle bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BookOpen className="h-8 w-8 text-brand-primary" />
              <Sparkles className="h-4 w-4 text-brand-secondary absolute -top-1 -right-1" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">DocuSense</h1>
            <span className="text-sm text-text-secondary hidden sm:inline">Intelligent PDF Reading</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => navigate('/library')}
              variant="outline"
              className="flex items-center gap-2 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">My Library</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-5xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 text-brand-primary text-sm font-medium border border-brand-primary/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full animate-pulse"></div>
              AI-Powered Reading Assistant
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-text-primary leading-[1.05] tracking-tight">
              Transform PDFs into
              <span className="text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text block mt-2">intelligent reading</span>
              experiences
            </h2>
            <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed font-light">
              Upload your documents and unlock AI-powered insights, personalized highlights, 
              and universal accessibility features designed for every reader.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-text-tertiary">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Instant Processing
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Privacy First
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Fully Accessible
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div id="upload-section" className="space-y-8">
            <Card className="p-8 bg-surface-elevated/80 backdrop-blur-xl border-border-subtle shadow-2xl">
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  Start Your Intelligent Reading Journey
                </CardTitle>
                <CardDescription className="text-lg text-text-secondary">
                  Upload PDFs and let AI enhance your reading experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle hover:border-brand-primary/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept=".pdf"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="h-8 w-8 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-text-primary">
                          Drop PDFs here or click to browse
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                          Support for multiple files • Max 50MB per file
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-text-secondary">Selected Files ({selectedFiles.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="px-3 py-1.5 bg-surface-hover rounded-lg text-sm text-text-primary flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-brand-primary" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Persona Input */}
                <div className="space-y-2">
                  <Label htmlFor="persona" className="text-text-primary font-medium">
                    Your Role <span className="text-text-tertiary">(e.g., Student, Researcher, Professional)</span>
                  </Label>
                  <Input
                    id="persona"
                    placeholder="I am a..."
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="bg-background/50 border-border-subtle focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Job to be Done Input */}
                <div className="space-y-2">
                  <Label htmlFor="job" className="text-text-primary font-medium">
                    What You Want to Accomplish
                  </Label>
                  <Input
                    id="job"
                    placeholder="I want to..."
                    value={jobToBeDone}
                    onChange={(e) => setJobToBeDone(e.target.value)}
                    className="bg-background/50 border-border-subtle focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Start Button - Fixed visibility */}
                <Button 
                  onClick={handleStart}
                  disabled={selectedFiles.length === 0 || isUploading}
                  size="lg"
                  className="w-full gap-3 h-16 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin" />
                      Processing PDFs...
                    </>
                  ) : (
                    <>
                      <Zap className="h-7 w-7" />
                      Start Intelligent Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Feature Cards - Enhanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card 
                className="group text-center transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-gradient-to-br from-surface-elevated/90 to-surface-elevated/70 backdrop-blur-md cursor-pointer hover:scale-105 overflow-hidden relative"
                onClick={() => handleFeatureClick('ai-insights')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 space-y-6 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Brain className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-text-primary">AI Insights</h3>
                  <p className="text-text-secondary leading-relaxed">Get intelligent summaries and key takeaways instantly</p>
                  <div className="text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Click to learn more 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group text-center transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-gradient-to-br from-surface-elevated/90 to-surface-elevated/70 backdrop-blur-md cursor-pointer hover:scale-105 overflow-hidden relative"
                onClick={() => handleFeatureClick('podcast')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 space-y-6 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Mic className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-text-primary">Podcast Mode</h3>
                  <p className="text-text-secondary leading-relaxed">Listen to your documents as engaging audio summaries</p>
                  <div className="text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Click to learn more 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group text-center transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-gradient-to-br from-surface-elevated/90 to-surface-elevated/70 backdrop-blur-md cursor-pointer hover:scale-105 overflow-hidden relative"
                onClick={() => handleFeatureClick('accessibility')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 space-y-6 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Accessibility className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-text-primary">Universal Access</h3>
                  <p className="text-text-secondary leading-relaxed">Dyslexia-friendly fonts, voice reading, and accessibility support</p>
                  <div className="text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Click to learn more 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group text-center transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-gradient-to-br from-surface-elevated/90 to-surface-elevated/70 backdrop-blur-md cursor-pointer hover:scale-105 overflow-hidden relative"
                onClick={() => handleFeatureClick('highlights')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 space-y-6 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Eye className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-text-primary">Smart Highlights</h3>
                  <p className="text-text-secondary leading-relaxed">Automatically highlight content relevant to your role</p>
                  <div className="text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Click to learn more 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group text-center transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-gradient-to-br from-surface-elevated/90 to-surface-elevated/70 backdrop-blur-md cursor-pointer hover:scale-105 overflow-hidden relative"
                onClick={() => handleFeatureClick('progress')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 space-y-6 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Clock className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-text-primary">Reading Progress</h3>
                  <p className="text-text-secondary leading-relaxed">Track your progress with intelligent time estimates</p>
                  <div className="text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Click to learn more 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group text-center transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-gradient-to-br from-surface-elevated/90 to-surface-elevated/70 backdrop-blur-md cursor-pointer hover:scale-105 overflow-hidden relative"
                onClick={() => handleFeatureClick('themes')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 space-y-6 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Palette className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-text-primary">Adaptive Themes</h3>
                  <p className="text-text-secondary leading-relaxed">Light, dark, and accessible themes for comfortable reading</p>
                  <div className="text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Click to learn more 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Demo Modal - Keep existing */}
      {showFeatureDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-text-primary">
                {showFeatureDemo === 'ai-insights' && 'AI Insights'}
                {showFeatureDemo === 'podcast' && 'Podcast Mode'}
                {showFeatureDemo === 'accessibility' && 'Universal Access'}
                {showFeatureDemo === 'highlights' && 'Smart Highlights'}
                {showFeatureDemo === 'progress' && 'Reading Progress'}
                {showFeatureDemo === 'themes' && 'Adaptive Themes'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeatureDemo(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4 text-text-secondary">
              {showFeatureDemo === 'ai-insights' && (
                <>
                  <p>AI Insights provides comprehensive analysis of your documents using advanced language models and web research.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Get key takeaways and important facts</li>
                    <li>Discover interesting connections and contradictions</li>
                    <li>Understand complex concepts through AI explanations</li>
                    <li><strong>NEW:</strong> Extract keywords and concepts automatically</li>
                    <li><strong>NEW:</strong> Get persona-specific analysis for your role</li>
                    <li><strong>NEW:</strong> Receive web search suggestions for current facts</li>
                    <li><strong>NEW:</strong> Access topic analysis and research opportunities</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF, set your role and goals, then click the Insights panel in the right sidebar. Use "Generate Comprehensive Insights" for advanced analysis.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'podcast' && (
                <>
                  <p>Podcast Mode converts your reading material into engaging audio summaries.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Listen to AI-narrated summaries of any section</li>
                    <li>Perfect for multitasking or accessibility</li>
                    <li>Customizable audio controls and playback</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF, then click the Podcast panel in the right sidebar to generate audio summaries.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'accessibility' && (
                <>
                  <p>Universal Access ensures everyone can read comfortably regardless of their needs.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Dyslexia-friendly fonts and spacing</li>
                    <li>Text-to-speech functionality</li>
                    <li>Color blindness support and high contrast</li>
                    <li>Customizable reading experience</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF, then click the Access panel in the right sidebar to customize your reading experience.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'highlights' && (
                <>
                  <p>Smart Highlights automatically identifies and highlights content relevant to your role and goals.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>AI-powered content relevance detection</li>
                    <li>Automatic highlighting of key sections</li>
                    <li>Personalized based on your persona and job</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF and set your role - highlights will appear automatically as you read.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'progress' && (
                <>
                  <p>Reading Progress helps you track your document consumption and stay organized.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Track reading time and progress</li>
                    <li>Monitor completion across multiple documents</li>
                    <li>Set reading goals and milestones</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Progress is tracked automatically as you read through your uploaded documents.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'themes' && (
                <>
                  <p>Adaptive Themes provide multiple visual options for comfortable reading in any environment.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Light, dark, and high-contrast themes</li>
                    <li>Automatic theme switching</li>
                    <li>Customizable color schemes</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Click the theme toggle button in the top navigation bar to switch between themes.
                  </p>
                </>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowFeatureDemo(null)}
                className="flex-1"
              >
                Got it!
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeatureDemo(null);
                  // Focus on the upload section
                  document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Start Reading
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-6 border-t border-border-subtle bg-surface-elevated/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center text-sm text-text-secondary">
          <p>Built for intelligent reading • Powered by AI • Accessible by design</p>
        </div>
      </footer>
    </div>
  );
}