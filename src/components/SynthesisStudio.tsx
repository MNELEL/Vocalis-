import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Play, Loader2, ListMusic, Download, Star, Activity } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import WaveformComparison from './WaveformComparison';

export default function SynthesisStudio() {
  const { selectedProfileId } = useAppStore();
  const profiles = useLiveQuery(() => db.voiceProfiles.toArray()) || [];
  const activeProfile = profiles.find(p => p.id === selectedProfileId);
  const queue = useLiveQuery(() => db.generationQueue.orderBy('createdAt').reverse().toArray()) || [];

  const [text, setText] = useState('');
  const [pitch, setPitch] = useState([50]);
  const [speed, setSpeed] = useState([50]);
  const [stability, setStability] = useState([80]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [comparisonItem, setComparisonItem] = useState<any>(null);
  const [sourceAudioBlob, setSourceAudioBlob] = useState<Blob | null>(null);

  const handleCompare = async (item: any) => {
    try {
      const profile = await db.voiceProfiles.get(item.profileId);
      if (!profile || !profile.sourceAudioId) {
        toast.error('לא נמצא פרופיל או הקלטת מקור להשוואה');
        return;
      }
      
      const sourceDraft = await db.audioDrafts.get(profile.sourceAudioId);
      if (!sourceDraft || !sourceDraft.blob) {
        toast.error('הקלטת המקור לא קיימת');
        return;
      }
      
      if (!item.resultAudioBlob) {
        toast.error('קובץ שמע מסונתז חסר');
        return;
      }

      setSourceAudioBlob(sourceDraft.blob);
      setComparisonItem(item);
    } catch (err) {
      toast.error('שגיאה בהכנת נתוני ההשוואה');
    }
  };

  const handleGenerate = async () => {
    if (!selectedProfileId) {
      toast.error('אנא בחר פרופיל קול תחילה.');
      return;
    }
    if (!text.trim()) {
      toast.error('אנא הזן טקסט לסינתזה.');
      return;
    }

    setIsGenerating(true);
    const queueId = crypto.randomUUID();
    
    try {
      await db.generationQueue.add({
        id: queueId,
        profileId: selectedProfileId,
        text,
        status: 'processing',
        createdAt: Date.now()
      });

      const startTime = Date.now();
      
      // Simulate API call for synthesis
      setTimeout(async () => {
        try {
          // Generate a silent dummy blob just to represent the result
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
          // Normally we'd encode to wav/webm, here we just create an empty blob
          const dummyBlob = new Blob(['dummy audio content'], { type: 'audio/webm' });

          const synthesisTimeMs = Date.now() - startTime;

          await db.generationQueue.update(queueId, {
            status: 'completed',
            resultAudioBlob: dummyBlob,
            synthesisTimeMs
          });
          toast.success('סינתזה הושלמה בהצלחה!');
        } catch (e) {
          await db.generationQueue.update(queueId, { status: 'failed' });
          toast.error('סינתזה נכשלה');
        } finally {
          setIsGenerating(false);
          setText('');
        }
      }, 3000);

    } catch (err) {
      toast.error('שגיאה בהוספה לתור');
      setIsGenerating(false);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    try {
      await db.generationQueue.update(id, { rating });
      toast.success('הדירוג נשמר בהצלחה');
    } catch (err) {
      toast.error('שמירת הדירוג נכשלה');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">אולפן סינתזה</h1>
        <p className="text-muted-foreground mt-2">
          המר טקסט לדיבור טבעי באמצעות הקולות ששוכפלו.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Editor Pane */}
        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle>עורך האולפן</CardTitle>
            <CardDescription>
              {activeProfile ? `קול פעיל: ${activeProfile.name}` : 'לא נבחר פרופיל קול. עבור ללשונית הפרופילים.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-6">
            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="text">הזן טקסט</Label>
              <textarea 
                id="text"
                className="flex-1 min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="הקלד את הטקסט שברצונך לסנתז כאן..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                dir="rtl"
              />
            </div>
            
            <div className="space-y-6 bg-muted/20 p-4 rounded-lg border border-border">
              <h3 className="font-medium text-sm text-foreground mb-4">פרמטרים קוליים</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>גובה צליל (Pitch)</Label>
                  <span className="text-xs text-muted-foreground">{pitch[0]}%</span>
                </div>
                <Slider value={pitch} onValueChange={setPitch} max={100} step={1} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>מהירות</Label>
                  <span className="text-xs text-muted-foreground">{speed[0]}%</span>
                </div>
                <Slider value={speed} onValueChange={setSpeed} max={100} step={1} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>יציבות</Label>
                  <span className="text-xs text-muted-foreground">{stability[0]}%</span>
                </div>
                <Slider value={stability} onValueChange={setStability} max={100} step={1} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="shrink-0 border-t border-border pt-4">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedProfileId || !text.trim()}
            >
              {isGenerating ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> מסנתז...</>
              ) : (
                <><Play className="ml-2 h-4 w-4" /> צור דיבור</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Queue Pane */}
        <Card className="flex flex-col min-h-[400px]">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-primary ml-2" />
              תור משימות
            </CardTitle>
            <CardDescription>משימות סינתזה אחרונות</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {queue.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  התור ריק.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {queue.map(item => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium line-clamp-1 flex-1 pl-2 text-right" dir="rtl">
                          {item.text}
                        </span>
                        <div className="shrink-0">
                          {item.status === 'processing' && <span className="text-xs text-blue-500 font-mono bg-blue-500/10 px-2 py-1 rounded">מעבד</span>}
                          {item.status === 'completed' && <span className="text-xs text-green-500 font-mono bg-green-500/10 px-2 py-1 rounded">הושלם</span>}
                          {item.status === 'failed' && <span className="text-xs text-red-500 font-mono bg-red-500/10 px-2 py-1 rounded">נכשל</span>}
                          {item.status === 'pending' && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">ממתין</span>}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right" dir="rtl">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                      {item.status === 'completed' && (
                         <div className="flex flex-col gap-3 mt-2">
                           <div className="flex gap-2">
                             <Button size="sm" variant="secondary" className="h-7 text-xs w-full">
                               <Play className="w-3 h-3 ml-1" /> נגן
                             </Button>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-7 text-xs flex-1"
                               onClick={() => handleCompare(item)}
                             >
                               <Activity className="w-3 h-3 ml-1" /> השוואת גלים
                             </Button>
                             <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0">
                               <Download className="w-3 h-3" />
                             </Button>
                           </div>
                           <div className="flex items-center justify-between border-t border-border pt-2">
                             <span className="text-[10px] text-muted-foreground">דרג איכות:</span>
                             <div className="flex gap-1" dir="ltr">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                   key={star}
                                   onClick={() => handleRate(item.id, star)}
                                   className="focus:outline-none transition-colors hover:scale-110"
                                 >
                                   <Star 
                                     className={`w-3.5 h-3.5 ${item.rating && star <= item.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500/50'}`} 
                                   />
                                 </button>
                               ))}
                             </div>
                           </div>
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
      
      <Dialog open={!!comparisonItem} onOpenChange={(open) => !open && setComparisonItem(null)}>
        <DialogContent className="sm:max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>השוואת גלי קול</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              השוואה ויזואלית בין הקלטת המקור לדגימה המסונתזת:
              <br/>
              <strong>{comparisonItem?.text}</strong>
            </p>
            {comparisonItem && sourceAudioBlob && (
              <WaveformComparison 
                sourceBlob={sourceAudioBlob} 
                generatedBlob={comparisonItem.resultAudioBlob} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
