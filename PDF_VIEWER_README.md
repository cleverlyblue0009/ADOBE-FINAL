# Interactive PDF Viewer Implementation

This project implements a feature-rich interactive PDF viewer in React with text highlighting, AI insights, and persistent storage capabilities.

## Features Implemented

### ✅ Core PDF Rendering
- **Mozilla PDF.js Integration**: Uses `pdfjs-dist` for native PDF rendering
- **Canvas + Text Layer**: Renders PDF pages to canvas with overlay text layer for selection
- **Native Text Selection**: Uses PDF.js text content with proper positioning
- **No Overlay Hacks**: Direct text layer implementation without blurred duplicates

### ✅ Text Selection & Highlighting
- **Window.getSelection() API**: Captures text selection using native browser APIs
- **Range API Support**: Proper text range handling for precise selection
- **Custom Tooltip**: Shows highlight and AI insight options on text selection
- **Span Wrapping**: Highlights wrapped in `<span class="highlight">` with custom styling
- **Persistent Storage**: Highlights saved to localStorage and restored on PDF reload

### ✅ AI Insights Integration
- **API Integration**: Configurable AI service with fallback to mock insights
- **Side Panel Display**: Clean side panel UI for displaying AI analysis
- **Insight Caching**: Previously generated insights cached locally
- **Selection-Triggered**: Only shows insights when user selects text (no random popups)

### ✅ Additional Features
- **Zoom Controls**: Zoom in/out with percentage display
- **Page Navigation**: Previous/next page navigation
- **Rotation Support**: 90-degree page rotation
- **File Upload**: Drag-and-drop or click to upload PDF files
- **Export/Import**: Export highlights as JSON, import from previous sessions
- **Statistics Display**: Show highlight count, insight count, and page coverage

## Technical Implementation

### Components

#### InteractivePDFViewer (`src/components/InteractivePDFViewer.tsx`)
- Main PDF viewer component with all interactive features
- Direct pdfjs-dist integration with manual text layer creation
- Text selection handling with tooltip display
- Highlight creation and persistence
- AI insights integration with side panel

#### PDFDemo (`src/pages/PDFDemo.tsx`)
- Demo page showcasing all PDF viewer features
- Statistics display and export/import functionality
- Feature explanations and usage instructions

### Utilities

#### PDFHighlightManager (`src/lib/pdfHighlightManager.ts`)
- Highlight and insight persistence using localStorage
- Document-based organization of highlights
- Export/import functionality
- AI service integration with fallback to mock data

### Styling

#### CSS (`src/index.css`)
- PDF.js text layer styling for proper text selection
- Highlight styling with opacity and color management
- Selection highlight styling for better UX

## Usage

### Basic Usage
```tsx
import { InteractivePDFViewer } from '@/components/InteractivePDFViewer';

function MyApp() {
  return (
    <InteractivePDFViewer
      documentId="my-document-id"
      onHighlightCreated={(highlight) => console.log('Highlight created:', highlight)}
      onAIInsightRequested={async (text) => {
        // Your AI API integration
        const response = await fetch('/api/ai-insights', {
          method: 'POST',
          body: JSON.stringify({ text }),
        });
        return response.text();
      }}
    />
  );
}
```

### Demo Page
Visit `/pdf-demo` to see the full implementation with:
- File upload interface
- Real-time statistics
- Export/import functionality
- Feature explanations

## Libraries Used

### Core Dependencies
- **pdfjs-dist**: Mozilla's PDF.js library for PDF rendering
- **React**: UI framework with hooks for state management
- **TypeScript**: Type safety and better developer experience

### UI Components
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI primitives (via shadcn/ui)
- **Lucide React**: Icon library

### Optional Libraries
- **react-pdf**: Not used (direct pdfjs-dist integration preferred)
- **pdf-annotate.js**: Not used (custom highlight implementation)

## Key Implementation Details

### Text Layer Creation
```typescript
// Manual text layer creation for better compatibility
textContent.items.forEach((item: any, index: number) => {
  if (item.str) {
    const textDiv = document.createElement('span');
    textDiv.textContent = item.str;
    textDiv.style.position = 'absolute';
    textDiv.style.left = `${item.transform[4]}px`;
    textDiv.style.top = `${viewport.height - item.transform[5]}px`;
    // ... more positioning and styling
  }
});
```

### Highlight Persistence
```typescript
// Highlights stored per document with unique IDs
const highlightManager = new PDFHighlightManager();
highlightManager.addHighlight(documentId, {
  id: generateId(),
  page: currentPage,
  text: selectedText,
  color: '#fef08a',
  timestamp: Date.now()
});
```

### AI Integration
```typescript
// Configurable AI service with caching
const aiService = new AIInsightService('/api/ai-insights');
const insight = await aiService.getInsights(selectedText, 'analysis');
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with minor styling differences)
- **Mobile**: Basic support (touch selection may vary)

## Performance Considerations

- **Lazy Loading**: Pages rendered on demand
- **Text Layer Caching**: Text content cached per page
- **Highlight Optimization**: Efficient DOM manipulation for highlight application
- **Memory Management**: Proper cleanup of render tasks and event listeners

## Future Enhancements

Potential improvements for production use:
- **Annotation Tools**: Drawing, shapes, and free-form annotations
- **Collaboration**: Real-time collaborative highlighting
- **Search**: Full-text search within PDFs
- **Accessibility**: Enhanced screen reader support
- **Performance**: Virtual scrolling for large documents
- **Mobile**: Touch-optimized selection and interaction

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install pdfjs-dist
   ```

2. **Add PDF.js Worker**: Ensure `pdf.worker.min.mjs` is in your `public` directory

3. **Import Component**:
   ```tsx
   import { InteractivePDFViewer } from '@/components/InteractivePDFViewer';
   ```

4. **Use in Your App**: See demo page for complete example

## Demo

The implementation includes a full demo at `/pdf-demo` with:
- Upload interface
- Feature showcase
- Usage instructions
- Statistics and export tools

This implementation provides a solid foundation for building advanced PDF interaction features while maintaining clean, maintainable code and excellent user experience.