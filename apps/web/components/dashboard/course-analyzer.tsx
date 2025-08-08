"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Video, 
  Link, 
  Download,
  BarChart3,
  TrendingUp,
  Activity
} from "lucide-react";
import { getSyncStatusMessage, getSyncStatusIcon, getSyncStatusColor } from "../../lib/utils/sync-status-messages";

interface CourseAnalysisResult {
  course_id: string;
  course_name: string;
  last_updated: string;
  content: {
    [key: string]: CourseContentItem[];
  };
  metadata: {
    total_items: number;
    categories_found: number;
    analysis_confidence: number;
    processing_time: number;
    content_type_distribution: {
      [key: string]: number;
    };
  };
}

interface CourseContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  due_date?: string;
  file_type: string;
  url: string;
  description: string;
  keywords: string[];
  is_interactive: boolean;
  is_file: boolean;
  is_link: boolean;
  estimated_complexity: string;
  index: number;
}

interface AnalysisStatus {
  analysis_id: string;
  status: string;
  progress: number;
  message: string;
  result?: CourseAnalysisResult;
}

interface CourseAnalyzerProps {
  userId: string;
  onAnalysisComplete?: (results: CourseAnalysisResult[]) => void;
}

export function CourseAnalyzer({ userId, onAnalysisComplete }: CourseAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [analysisResults, setAnalysisResults] = useState<CourseAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoAnalysisComplete, setAutoAnalysisComplete] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [stats, setStats] = useState({
    totalCourses: 0,
    newCourses: 0,
    totalItems: 0,
    averageConfidence: 0
  });

  // פונקציה להתחלת ניתוח
  const startAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // קריאה ל-API לניתוח
      const response = await fetch('/api/analyze-user-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          course_data: {}, // נתוני הקורס יגיעו מהשרת
          force_reanalysis: false
        })
      });

      if (!response.ok) {
        throw new Error('שגיאה בניתוח הקורסים');
      }

      const data = await response.json();
      setAnalysisStatus({
        analysis_id: data.analysis_id,
        status: data.status,
        progress: 0,
        message: data.message
      });

      // מעקב אחר התקדמות
      if (data.analysis_id) {
        pollAnalysisStatus(data.analysis_id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      setIsAnalyzing(false);
    }
  };

  // פונקציה למעקב אחר התקדמות
  const pollAnalysisStatus = async (analysisId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis-status/${analysisId}`);
        const status: AnalysisStatus = await response.json();

        setAnalysisStatus(status);

        if (status.status === 'completed' && status.result) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          
          // הוספת התוצאה לרשימה
          setAnalysisResults(prev => [...prev, status.result!]);
          
          // עדכון סטטיסטיקות
          updateStats();
          
          // קריאה לפונקציה חיצונית
          if (onAnalysisComplete) {
            onAnalysisComplete([status.result!]);
          }
        } else if (status.status === 'error') {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          setError('שגיאה בניתוח הקורס');
        }
      } catch (err) {
        clearInterval(pollInterval);
        setIsAnalyzing(false);
        setError('שגיאה במעקב אחר התקדמות');
      }
    }, 1000);
  };

  // פונקציה לעדכון סטטיסטיקות
  const updateStats = () => {
    const totalItems = analysisResults.reduce((sum, result) => sum + result.metadata.total_items, 0);
    const avgConfidence = analysisResults.reduce((sum, result) => sum + result.metadata.analysis_confidence, 0) / analysisResults.length;

    setStats({
      totalCourses: analysisResults.length,
      newCourses: analysisResults.length, // כרגע כל הקורסים חדשים
      totalItems,
      averageConfidence: avgConfidence
    });
  };

  // טעינת נתונים ראשונית
  useEffect(() => {
    loadExistingAnalyses();
    
    // בדיקה אם יש ניתוח אוטומטי פעיל
    checkAutoAnalysisStatus();
    
    // בדיקה אם יש סנכרון פעיל
    checkActiveSyncJob();
  }, [userId]);
  
  // פונקציה לבדיקת סטטוס ניתוח אוטומטי
  const checkAutoAnalysisStatus = async () => {
    try {
      const response = await fetch('/api/auth/auto-sync', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const analysisComplete = data.data.analysis_status?.status === 'completed';
        
        if (analysisComplete) {
          setAutoAnalysisComplete(true);
          // טעינת תוצאות הניתוח
          loadExistingAnalyses();
        }
      }
    } catch (err) {
      console.error('שגיאה בבדיקת סטטוס ניתוח אוטומטי:', err);
    }
  };

  // פונקציה לבדיקת job סנכרון פעיל
  const checkActiveSyncJob = async () => {
    try {
      const response = await fetch('/api/sync-status/active');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.hasActiveJob) {
          setSyncStatus(data);
          setSyncProgress(data.progress);
          
          // אם הסנכרון עדיין פעיל - התחבר לעדכונים
          if (data.status !== 'completed' && data.status !== 'error') {
            pollSyncStatus(data.jobId);
          }
        } else {
          setSyncStatus(null);
          setSyncProgress(0);
        }
      }
    } catch (err) {
      console.error('שגיאה בבדיקת job סנכרון פעיל:', err);
    }
  };

  // פונקציה למעקב אחר התקדמות סנכרון
  const pollSyncStatus = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-status/${jobId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          setSyncStatus(data);
          setSyncProgress(data.progress);
          
          // אם הסנכרון הסתיים - עצור את המעקב
          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(pollInterval);
            
            if (data.status === 'completed') {
              // טעינת נתונים חדשים
              loadExistingAnalyses();
            }
          }
        }
      } catch (err) {
        console.error('שגיאה במעקב אחר סנכרון:', err);
        clearInterval(pollInterval);
      }
    }, 2000); // בדיקה כל 2 שניות
  };

  const loadExistingAnalyses = async () => {
    try {
      const response = await fetch(`/api/user-courses/${userId}`);
      if (response.ok) {
        const results: CourseAnalysisResult[] = await response.json();
        setAnalysisResults(results);
        updateStats();
      }
    } catch (err) {
      console.error('שגיאה בטעינת ניתוחים קיימים:', err);
    }
  };

  // רכיב להצגת פריט תוכן
  const ContentItemCard = ({ item }: { item: CourseContentItem }) => (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{item.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {item.type}
              </Badge>
              <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {item.status}
              </Badge>
              {item.is_interactive && (
                <Badge variant="outline" className="text-xs">
                  אינטראקטיבי
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.is_file && <FileText className="h-4 w-4 text-blue-500" />}
            {item.is_link && <Link className="h-4 w-4 text-green-500" />}
            {item.is_interactive && <Activity className="h-4 w-4 text-purple-500" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // רכיב להצגת סטטיסטיקות
  const StatsCard = ({ title, value, icon: Icon, color }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string; 
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניתוח קורסים חכם</h2>
          <p className="text-muted-foreground">
            {autoAnalysisComplete 
              ? "ניתוח אוטומטי הושלם בהצלחה" 
              : "מערכת ניתוח אוטומטית לזיהוי וסיווג תוכן קורסים"
            }
          </p>
        </div>
        {!autoAnalysisComplete && !syncStatus && (
          <Button 
            onClick={startAnalysis} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                מעבד...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                התחל ניתוח ידני
              </>
            )}
          </Button>
        )}
      </div>

      {/* הצגת התקדמות סנכרון */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">{getSyncStatusIcon(syncStatus.status)}</span>
              <span className={getSyncStatusColor(syncStatus.status)}>
                {getSyncStatusMessage(syncStatus.status)}
              </span>
            </CardTitle>
            <CardDescription>
              {syncStatus.status === 'completed' 
                ? 'הנתונים שלך מוכנים לשימוש!' 
                : syncStatus.status === 'error'
                ? 'אירעה שגיאה בתהליך הסנכרון'
                : 'מעבד את הנתונים שלך...'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>התקדמות</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress 
                value={syncProgress} 
                className="h-3" 
                style={{
                  backgroundColor: syncProgress < 0 ? '#ef4444' : undefined
                }}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>עודכן: {new Date(syncStatus.updatedAt).toLocaleTimeString('he-IL')}</span>
                </div>
                {syncStatus.data && (
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>{syncStatus.data.totalCourses || 0} קורסים</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* הודעות שגיאה */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* סטטוס ניתוח */}
      {analysisStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {analysisStatus.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : analysisStatus.status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-blue-500" />
              )}
              סטטוס ניתוח
            </CardTitle>
            <CardDescription>{analysisStatus.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>התקדמות</span>
                <span>{analysisStatus.progress}%</span>
              </div>
              <Progress value={analysisStatus.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="סה״כ קורסים"
          value={stats.totalCourses}
          icon={BookOpen}
          color="bg-blue-500"
        />
        <StatsCard
          title="קורסים חדשים"
          value={stats.newCourses}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatsCard
          title="פריטי תוכן"
          value={stats.totalItems}
          icon={FileText}
          color="bg-purple-500"
        />
        <StatsCard
          title="רמת דיוק"
          value={`${(stats.averageConfidence * 100).toFixed(1)}%`}
          icon={BarChart3}
          color="bg-orange-500"
        />
      </div>

      {/* תוצאות ניתוח */}
      {analysisResults.length > 0 && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="content">תוכן מפורט</TabsTrigger>
            <TabsTrigger value="analytics">ניתוח נתונים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {analysisResults.map((result, index) => (
              <Card key={result.course_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {result.course_name}
                    <Badge variant="outline">
                      {result.metadata.total_items} פריטים
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    נותח לאחרונה: {new Date(result.last_updated).toLocaleDateString('he-IL')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(result.metadata.content_type_distribution).map(([type, count]) => (
                      <div key={type} className="text-center">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs text-muted-foreground">{type}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {analysisResults.map((result) => (
              <Card key={result.course_id}>
                <CardHeader>
                  <CardTitle>{result.course_name}</CardTitle>
                  <CardDescription>תוכן מפורט של הקורס</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="assignments" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="assignments">מטלות</TabsTrigger>
                      <TabsTrigger value="lectures">הרצאות</TabsTrigger>
                      <TabsTrigger value="files">קבצים</TabsTrigger>
                      <TabsTrigger value="other">אחר</TabsTrigger>
                    </TabsList>

                    <TabsContent value="assignments">
                      {result.content.assignments?.map((item) => (
                        <ContentItemCard key={item.id} item={item} />
                      )) || <p className="text-muted-foreground">אין מטלות</p>}
                    </TabsContent>

                    <TabsContent value="lectures">
                      {result.content.lectures?.map((item) => (
                        <ContentItemCard key={item.id} item={item} />
                      )) || <p className="text-muted-foreground">אין הרצאות</p>}
                    </TabsContent>

                    <TabsContent value="files">
                      {result.content.files?.map((item) => (
                        <ContentItemCard key={item.id} item={item} />
                      )) || <p className="text-muted-foreground">אין קבצים</p>}
                    </TabsContent>

                    <TabsContent value="other">
                      {result.content.other?.map((item) => (
                        <ContentItemCard key={item.id} item={item} />
                      )) || <p className="text-muted-foreground">אין פריטים אחרים</p>}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analysisResults.map((result) => (
              <Card key={result.course_id}>
                <CardHeader>
                  <CardTitle>ניתוח נתונים - {result.course_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">התפלגות תוכן</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(result.metadata.content_type_distribution).map(([type, count]) => (
                          <div key={type} className="bg-muted p-2 rounded">
                            <div className="text-sm font-medium">{type}</div>
                            <div className="text-lg font-bold">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">סטטיסטיקות</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">זמן עיבוד</div>
                          <div className="text-lg font-bold">{result.metadata.processing_time.toFixed(2)} שניות</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">רמת דיוק</div>
                          <div className="text-lg font-bold">{(result.metadata.analysis_confidence * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 