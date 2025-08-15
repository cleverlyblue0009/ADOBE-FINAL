import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface InsightBulb {
  id: string;
  x: number; // Percentage position
  y: number; // Percentage position
  insight: string;
  type: 'tip' | 'fact' | 'connection' | 'warning';
}

interface InsightBulbsProps {
  insights: InsightBulb[];
  currentPage: number;
  zoom: number;
}

export function InsightBulbs({ insights, currentPage, zoom }: InsightBulbsProps) {
  const [activeInsight, setActiveInsight] = useState<InsightBulb | null>(null);

  const pageInsights = insights.filter(insight => 
    // For demo, we'll show different insights on different pages
    (currentPage === 1 && insight.id.includes('page1')) ||
    (currentPage === 2 && insight.id.includes('page2')) ||
    (currentPage > 2 && insight.id.includes('general'))
  );

  const getInsightColor = (type: InsightBulb['type']) => {
    switch (type) {
      case 'tip': return 'text-blue-600 bg-blue-100 hover:bg-blue-200';
      case 'fact': return 'text-green-600 bg-green-100 hover:bg-green-200';
      case 'connection': return 'text-purple-600 bg-purple-100 hover:bg-purple-200';
      case 'warning': return 'text-orange-600 bg-orange-100 hover:bg-orange-200';
      default: return 'text-blue-600 bg-blue-100 hover:bg-blue-200';
    }
  };

  return (
    <>
      {/* Insight Bulbs */}
      {pageInsights.map((insight) => (
        <div
          key={insight.id}
          className="absolute z-20"
          style={{
            left: `${insight.x}%`,
            top: `${insight.y}%`,
            transform: `scale(${Math.max(0.8, Math.min(1.2, zoom))})`,
            transformOrigin: 'center'
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className={`w-8 h-8 p-0 rounded-full border-2 border-white shadow-lg animate-pulse ${getInsightColor(insight.type)}`}
            onClick={() => setActiveInsight(insight)}
            title="Click for insight"
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Insight Modal */}
      {activeInsight && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <Card className="max-w-md mx-4 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className={`h-5 w-5 ${getInsightColor(activeInsight.type).split(' ')[0]}`} />
                  <h3 className="font-semibold text-lg capitalize">
                    {activeInsight.type === 'connection' ? 'Key Connection' : 
                     activeInsight.type === 'warning' ? 'Important Note' :
                     activeInsight.type === 'fact' ? 'Key Fact' : 'Pro Tip'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveInsight(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {activeInsight.insight}
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setActiveInsight(null)}
                  size="sm"
                >
                  Got it!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Sample insights data - in a real app, this would come from AI analysis
export const sampleInsights: InsightBulb[] = [
  {
    id: 'page1-tip1',
    x: 75,
    y: 25,
    insight: 'This section introduces the core concept of AI in healthcare. Pay special attention to the accuracy metrics mentioned here as they will be referenced throughout the document.',
    type: 'tip'
  },
  {
    id: 'page1-fact1',
    x: 20,
    y: 45,
    insight: 'The 94% accuracy rate mentioned here is significantly higher than traditional diagnostic methods. This represents a major breakthrough in medical AI applications.',
    type: 'fact'
  },
  {
    id: 'page2-connection1',
    x: 60,
    y: 35,
    insight: 'This EHR integration challenge connects directly to the regulatory compliance issues discussed on page 5. Consider how these two factors interact.',
    type: 'connection'
  },
  {
    id: 'page2-warning1',
    x: 30,
    y: 60,
    insight: 'Data privacy concerns mentioned here are critical for your analysis. This will likely impact implementation timelines and costs significantly.',
    type: 'warning'
  },
  {
    id: 'general-tip1',
    x: 80,
    y: 20,
    insight: 'As you read through this section, consider how the concepts relate to your specific role and objectives. Look for practical applications.',
    type: 'tip'
  }
];