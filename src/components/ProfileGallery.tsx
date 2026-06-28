import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, User, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function ProfileGallery() {
  const profiles = useLiveQuery(() => db.voiceProfiles.toArray()) || [];
  const drafts = useLiveQuery(() => db.audioDrafts.toArray()) || [];
  const { setSelectedProfileId } = useAppStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState('');

  const createProfile = async () => {
    if (!newProfileName.trim() || !selectedDraftId) {
      toast.error('אנא ספק שם ובחר טיוטת שמע כרפרנס.');
      return;
    }
    
    try {
      const id = crypto.randomUUID();
      await db.voiceProfiles.add({
        id,
        name: newProfileName,
        description: newProfileDesc,
        sourceAudioId: selectedDraftId,
        createdAt: Date.now()
      });
      toast.success('פרופיל הקול נוצר בהצלחה');
      setIsDialogOpen(false);
      setNewProfileName('');
      setNewProfileDesc('');
      setSelectedDraftId('');
    } catch (error) {
      toast.error('יצירת הפרופיל נכשלה');
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await db.voiceProfiles.delete(id);
      toast.success('פרופיל נמחק');
      if (useAppStore.getState().selectedProfileId === id) {
        setSelectedProfileId(null);
      }
    } catch (error) {
      toast.error('מחיקת הפרופיל נכשלה');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">פרופילי קול</h1>
          <p className="text-muted-foreground mt-2">
            נהל את מודלי הקול המותאמים אישית שלך ובחר פרופיל פעיל.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" /> פרופיל חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>צור פרופיל קול</DialogTitle>
              <DialogDescription>
                בנה פרופיל קול חדש מתוך טיוטת שמע קיימת.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>שם הפרופיל</Label>
                <Input 
                  placeholder="למשל, מקצועי וניטרלי" 
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Input 
                  placeholder="תיאור קצר של גוון הקול" 
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>טיוטת שמע למקור</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={selectedDraftId}
                  onChange={(e) => setSelectedDraftId(e.target.value)}
                  dir="rtl"
                >
                  <option value="" className="bg-background text-foreground">בחר טיוטה...</option>
                  {drafts.map(draft => (
                    <option key={draft.id} value={draft.id} className="bg-background text-foreground">
                      {draft.name} ({new Date(draft.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
              <Button onClick={createProfile}>צור פרופיל</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-card text-center">
          <User className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">לא נמצאו פרופילים</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mb-4">
            טרם יצרת פרופילי קול. הקלט שמע וצור את הפרופיל הראשון שלך.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            צור פרופיל ראשון
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => {
            const isSelected = useAppStore.getState().selectedProfileId === profile.id;
            return (
              <Card key={profile.id} className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary border-transparent' : ''}`}>
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      {profile.name}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100" onClick={() => deleteProfile(profile.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2 pt-2">
                    {profile.description || 'לא סופק תיאור.'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 flex gap-2">
                  <Button 
                    variant={isSelected ? "secondary" : "default"} 
                    className="w-full"
                    onClick={() => {
                      setSelectedProfileId(profile.id);
                      toast.info(`פרופיל נבחר: ${profile.name}`);
                    }}
                  >
                    {isSelected ? 'פרופיל פעיל' : 'בחר פרופיל'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
