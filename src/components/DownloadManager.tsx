// Download Manager Component
// Provides UI for downloading highlighted PDFs with various options

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  Palette, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { pdfDownloadManager, DownloadOptions } from '@/lib/pdfDownloadManager';
import { Highlight } from './PDFReader';

interface DownloadManagerProps {
  documentUrl: string;
  documentName: string;
  highlights: Highlight[];
  disabled?: boolean;
}

export function DownloadManager({
  documentUrl,
  documentName,
  highlights,
  disabled = false
}: DownloadManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    includeMetadata: true,
    includeAnnotations: true,
    compressionLevel: 'medium',
    colorProfile: 'standard'
  });
  const { toast } = useToast();

  const handleDownload = async () => {
    if (highlights.length === 0) {
      toast({
        title: "No Highlights Available",
        description: "Please add some highlights before downloading the PDF.",
        variant: "destructive"
      });
      return;
    }

    // Validate highlights
    const validation = pdfDownloadManager.validateHighlights(highlights);
    if (!validation.valid) {
      toast({
        title: "Invalid Highlights",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);

    try {
      const filename = `highlighted_${documentName.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await pdfDownloadManager.downloadHighlightedPDF(
        documentUrl,
        highlights,
        filename,
        downloadOptions
      );

      toast({
        title: "Download Started",
        description: `Your highlighted PDF "${filename}" is being downloaded.`,
      });

      setIsOpen(false);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download highlighted PDF",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getHighlightStats = () => {
    const stats = {
      total: highlights.length,
      byColor: {} as Record<string, number>
    };

    highlights.forEach(highlight => {
      stats.byColor[highlight.color] = (stats.byColor[highlight.color] || 0) + 1;
    });

    return stats;
  };

  const stats = getHighlightStats();

  const colorLabels = {
    primary: 'Key Concepts',
    secondary: 'Definitions', 
    tertiary: 'Statistics',
    quaternary: 'Action Items'
  };

  const colorClasses = {
    primary: 'bg-yellow-100 text-yellow-800',
    secondary: 'bg-green-100 text-green-800',
    tertiary: 'bg-blue-100 text-blue-800',
    quaternary: 'bg-orange-100 text-orange-800'
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || highlights.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Highlighted PDF
          {highlights.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {highlights.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-primary" />
            Download Highlighted PDF
          </DialogTitle>
          <DialogDescription>
            Customize your highlighted PDF download options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Highlight Summary */}
          <div className="bg-background rounded-lg p-3 border border-border-subtle">
            <h4 className="text-sm font-medium text-text-primary mb-2">
              Highlight Summary
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Total Highlights:</span>
                <span className="font-medium text-text-primary">{stats.total}</span>
              </div>
              
              {Object.entries(stats.byColor).map(([color, count]) => (
                <div key={color} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${colorClasses[color as keyof typeof colorClasses]}`} />
                    <span className="text-text-secondary">
                      {colorLabels[color as keyof typeof colorLabels]}:
                    </span>
                  </div>
                  <span className="font-medium text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Options
            </h4>

            {/* Metadata Option */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="metadata" className="text-sm font-medium">
                  Include Metadata
                </Label>
                <p className="text-xs text-text-tertiary">
                  Add document information and highlight statistics
                </p>
              </div>
              <Switch
                id="metadata"
                checked={downloadOptions.includeMetadata}
                onCheckedChange={(checked) =>
                  setDownloadOptions(prev => ({ ...prev, includeMetadata: checked }))
                }
              />
            </div>

            {/* Annotations Option */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="annotations" className="text-sm font-medium">
                  Include Annotations
                </Label>
                <p className="text-xs text-text-tertiary">
                  Add clickable notes with highlight explanations
                </p>
              </div>
              <Switch
                id="annotations"
                checked={downloadOptions.includeAnnotations}
                onCheckedChange={(checked) =>
                  setDownloadOptions(prev => ({ ...prev, includeAnnotations: checked }))
                }
              />
            </div>

            {/* Color Profile */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Profile
              </Label>
              <Select
                value={downloadOptions.colorProfile}
                onValueChange={(value: any) =>
                  setDownloadOptions(prev => ({ ...prev, colorProfile: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Colors</SelectItem>
                  <SelectItem value="accessible">High Contrast (Accessible)</SelectItem>
                  <SelectItem value="printer-friendly">Printer Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compression Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                File Size
              </Label>
              <Select
                value={downloadOptions.compressionLevel}
                onValueChange={(value: any) =>
                  setDownloadOptions(prev => ({ ...prev, compressionLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Largest (No Compression)</SelectItem>
                  <SelectItem value="low">Large (Low Compression)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">Small (High Compression)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warning for no highlights */}
          {highlights.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                No highlights available. Add some highlights first.
              </span>
            </div>
          )}

          {/* Success indicator */}
          {highlights.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Ready to download {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading || highlights.length === 0}
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}