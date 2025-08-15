import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Eye,
  Brain,
  Zap,
  Calendar,
  Award,
  BarChart3,
  Timer,
  Flame
} from 'lucide-react';

interface ReadingAnalyticsPanelProps {
  currentPage: number;
  totalPages: number;
  readingStartTime: number;
  isActivelyReading: boolean;
  documentsRead: number;
  persona?: string;
  jobToBeDone?: string;
}

interface ReadingSession {
  date: string;
  duration: number;
  pagesRead: number;
  focusScore: number;
}

export function ReadingAnalyticsPanel({
  currentPage,
  totalPages,
  readingStartTime,
  isActivelyReading,
  documentsRead,
  persona,
  jobToBeDone
}: ReadingAnalyticsPanelProps) {
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [readingStreak, setReadingStreak] = useState(7); // Mock streak
  const [averageReadingSpeed, setAverageReadingSpeed] = useState(2.5); // pages per minute
  const [focusScore, setFocusScore] = useState(85); // percentage
  const [weeklyGoal, setWeeklyGoal] = useState(50); // pages per week
  const [weeklyProgress, setWeeklyProgress] = useState(32);

  // Mock recent sessions data
  const recentSessions: ReadingSession[] = [
    { date: 'Today', duration: 45, pagesRead: 12, focusScore: 88 },
    { date: 'Yesterday', duration: 38, pagesRead: 10, focusScore: 82 },
    { date: '2 days ago', duration: 52, pagesRead: 15, focusScore: 91 },
    { date: '3 days ago', duration: 29, pagesRead: 8, focusScore: 76 },
    { date: '4 days ago', duration: 41, pagesRead: 11, focusScore: 85 }
  ];

  // Update current session time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActivelyReading) {
      interval = setInterval(() => {
        setCurrentSessionTime(Math.floor((Date.now() - readingStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActivelyReading, readingStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const progressPercentage = Math.round((currentPage / totalPages) * 100);
  const estimatedTimeLeft = Math.round((totalPages - currentPage) / averageReadingSpeed);

  const getFocusScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFocusScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Needs Focus', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-text-primary">Reading Analytics</h3>
        </div>
        <p className="text-xs text-text-secondary">
          Track your reading progress and habits
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Session */}
        <Card className="border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-brand-primary" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Time Reading</span>
              <Badge variant="secondary" className="font-mono">
                {formatTime(currentSessionTime)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Current Page</span>
              <Badge variant="outline">{currentPage} of {totalPages}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Progress</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            {isActivelyReading && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">Actively reading</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reading Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-lg font-bold text-text-primary">{readingStreak}</div>
              <div className="text-xs text-text-secondary">Day Streak</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-lg font-bold text-text-primary">{averageReadingSpeed}</div>
              <div className="text-xs text-text-secondary">Pages/Min</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-5 w-5 text-purple-500" />
              </div>
              <div className={`text-lg font-bold ${getFocusScoreColor(focusScore)}`}>
                {focusScore}%
              </div>
              <div className="text-xs text-text-secondary">Focus Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-lg font-bold text-text-primary">{documentsRead}</div>
              <div className="text-xs text-text-secondary">Docs Read</div>
            </CardContent>
          </Card>
        </div>

        {/* Focus Score Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Focus Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Current Focus</span>
              <Badge className={getFocusScoreBadge(focusScore).color}>
                {getFocusScoreBadge(focusScore).text}
              </Badge>
            </div>
            <Progress value={focusScore} className="h-2" />
            <div className="text-xs text-text-secondary">
              Based on reading speed, time spent per page, and interaction patterns
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Pages Read</span>
              <span className="text-sm font-medium">{weeklyProgress} / {weeklyGoal}</span>
            </div>
            <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-2" />
            <div className="text-xs text-text-secondary">
              {weeklyGoal - weeklyProgress} pages to go this week
            </div>
          </CardContent>
        </Card>

        {/* Time Estimation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Estimates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Time to finish</span>
              <Badge variant="outline">{formatDuration(estimatedTimeLeft)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Pages remaining</span>
              <Badge variant="outline">{totalPages - currentPage}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSessions.slice(0, 3).map((session, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-b-0">
                <div className="flex-1">
                  <div className="text-sm font-medium">{session.date}</div>
                  <div className="text-xs text-text-secondary">
                    {formatDuration(session.duration)} • {session.pagesRead} pages
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getFocusScoreColor(session.focusScore)}`}
                >
                  {session.focusScore}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                🔥
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Week Warrior</div>
                <div className="text-xs text-text-secondary">7-day reading streak</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                🎯
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Focus Master</div>
                <div className="text-xs text-text-secondary">85%+ focus score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personalized Insights */}
        {persona && jobToBeDone && (
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Personalized Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-text-primary">
                As a <span className="font-medium text-purple-600">{persona}</span> working on{' '}
                <span className="font-medium text-blue-600">{jobToBeDone}</span>:
              </div>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Your reading speed is 15% above average for your role</li>
                <li>• Peak focus time: 2-4 PM (current session aligns well)</li>
                <li>• Recommended break every 25-30 minutes</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}