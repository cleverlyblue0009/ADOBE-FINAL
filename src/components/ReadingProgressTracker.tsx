import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Flame, 
  Target, 
  Clock, 
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  BarChart3,
  Calendar
} from 'lucide-react';

interface ReadingStats {
  pagesRead: number;
  totalPages: number;
  readingTime: number; // in minutes
  averageSpeed: number; // pages per minute
  streak: number; // days
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface ReadingProgressTrackerProps {
  currentPage: number;
  totalPages: number;
  documentName?: string;
}

export function ReadingProgressTracker({ 
  currentPage, 
  totalPages,
  documentName 
}: ReadingProgressTrackerProps) {
  const [stats, setStats] = useState<ReadingStats>({
    pagesRead: currentPage,
    totalPages: totalPages,
    readingTime: 0,
    averageSpeed: 0,
    streak: 1,
    achievements: []
  });
  
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [showDetails, setShowDetails] = useState(false);

  const achievements: Achievement[] = [
    {
      id: 'speed-reader',
      title: 'Speed Reader',
      description: 'Read 10 pages in under 5 minutes',
      icon: <Zap className="h-4 w-4" />,
      unlocked: stats.averageSpeed > 2,
      progress: Math.min(stats.pagesRead, 10),
      maxProgress: 10
    },
    {
      id: 'consistent-reader',
      title: 'Consistent Reader',
      description: 'Maintain a 7-day reading streak',
      icon: <Flame className="h-4 w-4" />,
      unlocked: stats.streak >= 7,
      progress: stats.streak,
      maxProgress: 7
    },
    {
      id: 'deep-diver',
      title: 'Deep Diver',
      description: 'Read for 30 minutes continuously',
      icon: <Clock className="h-4 w-4" />,
      unlocked: stats.readingTime >= 30,
      progress: Math.min(stats.readingTime, 30),
      maxProgress: 30
    },
    {
      id: 'completionist',
      title: 'Completionist',
      description: 'Finish reading an entire document',
      icon: <Trophy className="h-4 w-4" />,
      unlocked: stats.pagesRead >= stats.totalPages,
      progress: stats.pagesRead,
      maxProgress: stats.totalPages
    }
  ];

  useEffect(() => {
    // Update reading time every minute
    const interval = setInterval(() => {
      const minutesElapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
      setStats(prev => ({
        ...prev,
        readingTime: minutesElapsed,
        averageSpeed: minutesElapsed > 0 ? prev.pagesRead / minutesElapsed : 0
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      pagesRead: currentPage,
      totalPages: totalPages
    }));
  }, [currentPage, totalPages]);

  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const estimatedTimeRemaining = stats.averageSpeed > 0 
    ? Math.ceil((totalPages - currentPage) / stats.averageSpeed)
    : null;

  const getMotivationalMessage = () => {
    if (progressPercentage < 25) return "Great start! Keep going! 🚀";
    if (progressPercentage < 50) return "You're making excellent progress! 📚";
    if (progressPercentage < 75) return "Over halfway there! Amazing! 🎯";
    if (progressPercentage < 100) return "Almost finished! Final push! 🏁";
    return "Congratulations! You've completed this document! 🎉";
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-primary" />
              Reading Progress
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Page {currentPage} of {totalPages}</span>
              <span className="text-text-secondary">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-center text-text-secondary font-medium">
              {getMotivationalMessage()}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-text-secondary">Reading Time</span>
              </div>
              <p className="text-lg font-bold text-text-primary">
                {stats.readingTime} min
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-text-secondary">Streak</span>
              </div>
              <p className="text-lg font-bold text-text-primary">
                {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          {estimatedTimeRemaining && (
            <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Estimated time to finish:
                </span>
                <span className="font-bold text-brand-primary">
                  {estimatedTimeRemaining} minutes
                </span>
              </div>
            </div>
          )}

          {/* Achievements Section */}
          {showDetails && (
            <div className="space-y-3 pt-3 border-t border-border-subtle">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Achievements
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`
                      p-2 rounded-lg border transition-all
                      ${achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 dark:from-yellow-950/20 dark:to-orange-950/20' 
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 opacity-60'}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`
                        p-1.5 rounded-lg
                        ${achievement.unlocked ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'}
                      `}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {achievement.progress}/{achievement.maxProgress}
                        </p>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-1 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Goal */}
          <div className="bg-green-100/50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                Daily Goal
              </span>
              <Badge variant="secondary" className="text-xs">
                20 pages/day
              </Badge>
            </div>
            <Progress 
              value={Math.min((currentPage / 20) * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-text-secondary mt-1">
              {currentPage}/20 pages completed today
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}