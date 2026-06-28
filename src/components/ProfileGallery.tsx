import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type VoiceProfile } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  User, 
  Play, 
  Edit2, 
  Sliders, 
  Sparkles, 
  HelpCircle, 
  Check, 
  Activity,
  UserCheck,
  Languages,
  Wind
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// Hebrew Localization Labels
const genderLabels = {
  male: 'גבר',
  female: 'אישה',
  neutral: 'ניטרלי'
};

const ageLabels = {
  young: 'צעיר/ה',
  mature: 'בוגר/ת',
  elder: 'מבוגר/ת'
};

const toneLabels = {
  warm: 'חם וידידותי',
  professional: 'מקצועי ורשמי',
  dramatic: 'דרמטי ותיאטרלי',
  energetic: 'אנרגטי וקצבי',
  soft: 'רך ורגוע'
};

const accentLabels = {
  standard: 'עברית סטנדרטית',
  oriental: 'מבטא מזרחי',
  european: 'מבטא אירופאי',
  american: 'מבטא אמריקאי'
};

const resonanceLabels = {
  chest: 'תהודת חזה (עמוק)',
  head: 'תהודת ראש (בהיר)',
  nasal: 'תהודה אפית'
};

const emotionLabels = {
  calm: 'רגוע ושלו',
  excited: 'נלהב ונמרץ',
  empathic: 'אמפתי ומזדהה',
  neutral: 'ניטרלי ושקול',
  assertive: 'אסרטיבי ובטוח'
};

// Natural voice profile descriptor in Hebrew
const generateAutoDescription = (
  name: string,
  gender: 'male' | 'female' | 'neutral',
  ageGroup: 'young' | 'mature' | 'elder',
  pitch: number,
  speed: number,
  toneVibe: string,
  accent: string,
  resonance: string,
  emotion: string
): string => {
  const genderWord = gender === 'male' ? 'קריין' : gender === 'female' ? 'קריינית' : 'קול';
  const ageWord = ageGroup === 'young' ? 'צעיר ורענן' : ageGroup === 'mature' ? 'בוגר וסמכותי' : 'מבוגר ומנוסה';
  
  const pitchWord = pitch < 35 ? 'נמוך ועמוק במיוחד' : pitch > 65 ? 'גבוה וצלול' : 'בגובה בינוני ומאוזן';
  const speedWord = speed < 35 ? 'מתון ואיטי' : speed > 65 ? 'קצבי ודינמי' : 'במהירות טבעית ומאוזנת';
  
  const toneMap: Record<string, string> = {
    warm: 'בעל גוון חם ומזמין המשרה ביטחון',
    professional: 'בסגנון מקצועי, רשמי ומדויק',
    dramatic: 'בטון דרמטי ותיאטרלי עם נוכחות רבה',
    energetic: 'אנרגטי, קצבי ומלא חיות',
    soft: 'רך, עדין ומלטף'
  };
  
  const accentMap: Record<string, string> = {
    standard: 'בעברית צברית נקייה',
    oriental: 'במבטא ים-תיכוני אותנטי',
    european: 'במבטא אירופאי מעודן',
    american: 'במבטא אמריקאי קל'
  };
  
  const resonanceMap: Record<string, string> = {
    chest: 'המופק בתהודת חזה עמוקה ומלאה',
    head: 'המופק בתהודת ראש בהירה ומתוחכמת',
    nasal: 'המופק בתהודה אפית ממוקדת'
  };
  
  const emotionMap: Record<string, string> = {
    calm: 'המשדר רוגע, שלווה ונינוחות מוחלטת',
    excited: 'המבטא התלהבות, אנרגיה שיא ושמחה',
    empathic: 'המשרה חמלה, הבנה וחיבור אנושי עמוק',
    neutral: 'הנשמר שקול, אובייקטיבי ומאוזן',
    assertive: 'המעביר נחישות, ביטחון עצמי ועוצמה'
  };

  const toneText = toneMap[toneVibe] || 'בסגנון מאוזן';
  const accentText = accentMap[accent] || 'בעברית תקנית';
  const resonanceText = resonanceMap[resonance] || '';
  const emotionText = emotionMap[emotion] || '';

  return `פרופיל ${genderWord} ${ageWord}, ${toneText}. הדיבור מופק ${resonanceText} ${accentText}, בגובה צליל ${pitchWord} ובקצב ${speedWord}. סגנון ההבעה הנוכחי הוא ${emotionText}.`;
};

export default function ProfileGallery() {
  const profiles = useLiveQuery(() => db.voiceProfiles.toArray()) || [];
  const drafts = useLiveQuery(() => db.audioDrafts.toArray()) || [];
  const { setSelectedProfileId, selectedProfileId } = useAppStore();
  
  // Create Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState('');
  
  // Voice Characterization Parameters for Creation
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [ageGroup, setAgeGroup] = useState<'young' | 'mature' | 'elder'>('mature');
  const [pitch, setPitch] = useState<number[]>([50]);
  const [speed, setSpeed] = useState<number[]>([50]);
  const [toneVibe, setToneVibe] = useState<'warm' | 'professional' | 'dramatic' | 'energetic' | 'soft'>('professional');
  const [accent, setAccent] = useState<'standard' | 'oriental' | 'european' | 'american'>('standard');
  const [resonance, setResonance] = useState<'chest' | 'head' | 'nasal'>('chest');
  const [emotion, setEmotion] = useState<'calm' | 'excited' | 'empathic' | 'neutral' | 'assertive'>('neutral');

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [editAgeGroup, setEditAgeGroup] = useState<'young' | 'mature' | 'elder'>('mature');
  const [editPitch, setEditPitch] = useState<number[]>([50]);
  const [editSpeed, setEditSpeed] = useState<number[]>([50]);
  const [editToneVibe, setEditToneVibe] = useState<'warm' | 'professional' | 'dramatic' | 'energetic' | 'soft'>('professional');
  const [editAccent, setEditAccent] = useState<'standard' | 'oriental' | 'european' | 'american'>('standard');
  const [editResonance, setEditResonance] = useState<'chest' | 'head' | 'nasal'>('chest');
  const [editEmotion, setEditEmotion] = useState<'calm' | 'excited' | 'empathic' | 'neutral' | 'assertive'>('neutral');

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
        createdAt: Date.now(),
        gender,
        ageGroup,
        pitch: pitch[0],
        speed: speed[0],
        toneVibe,
        accent,
        resonance,
        emotion
      });
      toast.success('פרופיל הקול נוצר בהצלחה');
      setIsDialogOpen(false);
      
      // Reset form fields
      setNewProfileName('');
      setNewProfileDesc('');
      setSelectedDraftId('');
      setGender('neutral');
      setAgeGroup('mature');
      setPitch([50]);
      setSpeed([50]);
      setToneVibe('professional');
      setAccent('standard');
      setResonance('chest');
      setEmotion('neutral');
    } catch (error) {
      toast.error('יצירת הפרופיל נכשלה');
    }
  };

  const openEditDialog = (profile: VoiceProfile) => {
    setEditingProfileId(profile.id);
    setEditName(profile.name || '');
    setEditDesc(profile.description || '');
    setEditGender(profile.gender || 'neutral');
    setEditAgeGroup(profile.ageGroup || 'mature');
    setEditPitch([profile.pitch !== undefined ? profile.pitch : 50]);
    setEditSpeed([profile.speed !== undefined ? profile.speed : 50]);
    setEditToneVibe(profile.toneVibe || 'professional');
    setEditAccent(profile.accent || 'standard');
    setEditResonance(profile.resonance || 'chest');
    setEditEmotion(profile.emotion || 'neutral');
    setIsEditDialogOpen(true);
  };

  const saveEditedProfile = async () => {
    if (!editingProfileId) return;
    if (!editName.trim()) {
      toast.error('שם הפרופיל אינו יכול להיות ריק');
      return;
    }

    try {
      await db.voiceProfiles.update(editingProfileId, {
        name: editName,
        description: editDesc,
        gender: editGender,
        ageGroup: editAgeGroup,
        pitch: editPitch[0],
        speed: editSpeed[0],
        toneVibe: editToneVibe,
        accent: editAccent,
        resonance: editResonance,
        emotion: editEmotion
      });
      toast.success('פרופיל הקול עודכן בהצלחה');
      setIsEditDialogOpen(false);
      setEditingProfileId(null);
    } catch (err) {
      toast.error('עדכון הפרופיל נכשל');
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await db.voiceProfiles.delete(id);
      toast.success('פרופיל נמחק');
      if (selectedProfileId === id) {
        setSelectedProfileId(null);
      }
    } catch (error) {
      toast.error('מחיקת הפרופיל נכשלה');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Upper bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="w-7 h-7 text-indigo-500" />
            פרופילי קול & אפיון פרמטרים
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            נהל את מודלי הקול שלך, אפין אותם לפי פרמטרים מדויקים (מגדר, גיל, גובה צליל, מבטא, תהודה) וכייל את העדפות המערכת.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 ml-2" /> פרופיל חדש
          </DialogTrigger>
          <DialogContent className="max-w-[550px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                יצירת פרופיל קול מאופיין
              </DialogTitle>
              <DialogDescription className="text-xs">
                בנה פרופיל קול חדש מתוך טיוטת שמע קיימת והגדר אפיון שמע מדויק.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm max-h-[420px] overflow-y-auto px-1">
              
              {/* Basic Meta fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">שם הפרופיל</Label>
                  <Input 
                    placeholder="למשל, קריין רדיו סמכותי" 
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    dir="rtl"
                    className="h-9 text-xs"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-foreground">תיאור ואפיון קולי</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 gap-1"
                      onClick={() => {
                        const autoDesc = generateAutoDescription(
                          newProfileName || 'קול מותאם',
                          gender,
                          ageGroup,
                          pitch[0],
                          speed[0],
                          toneVibe,
                          accent,
                          resonance,
                          emotion
                        );
                        setNewProfileDesc(autoDesc);
                        toast.success('התיאור האוטומטי נוצר בהצלחה!');
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                      ייצר תיאור אוטומטי
                    </Button>
                  </div>
                  <textarea 
                    placeholder="תיאור סגנון, גוון, מבטא ורגש (ניתן לכתוב ידנית או לייצר אוטומטית מתחת)" 
                    value={newProfileDesc}
                    onChange={(e) => setNewProfileDesc(e.target.value)}
                    dir="rtl"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-card px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Source Draft */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">טיוטת שמע למקור (Reference)</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={selectedDraftId}
                  onChange={(e) => setSelectedDraftId(e.target.value)}
                  dir="rtl"
                >
                  <option value="" className="bg-background text-foreground">בחר טיוטה מקורית להשוואה...</option>
                  {drafts.map(draft => (
                    <option key={draft.id} value={draft.id} className="bg-background text-foreground">
                      {draft.name} ({new Date(draft.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border pt-3 space-y-3.5">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  פרמטרי אפיון פיזיולוגיים וסגנוניים
                </span>

                {/* Gender, Age, Tone Row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">מגדר קולי</Label>
                    <select
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                    >
                      <option value="male">גברי</option>
                      <option value="female">נשי</option>
                      <option value="neutral">ניטרלי / מעורב</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">קבוצת גיל</Label>
                    <select
                      value={ageGroup}
                      onChange={(e: any) => setAgeGroup(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                    >
                      <option value="young">צעיר (אנרגטי)</option>
                      <option value="mature">בוגר (סמכותי)</option>
                      <option value="elder">מבוגר (מיושב)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">טון ואווירה</Label>
                    <select
                      value={toneVibe}
                      onChange={(e: any) => setToneVibe(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                    >
                      <option value="professional">מקצועי ורשמי</option>
                      <option value="warm">חם וידידותי</option>
                      <option value="soft">רך ורגוע</option>
                      <option value="energetic">אנרגטי וקצבי</option>
                      <option value="dramatic">דרמטי ותיאטרלי</option>
                    </select>
                  </div>
                </div>

                {/* Accent, Resonance & Emotion Row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">מבטא והגייה</Label>
                    <select
                      value={accent}
                      onChange={(e: any) => setAccent(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                    >
                      <option value="standard">עברית סטנדרטית</option>
                      <option value="oriental">מבטא מזרחי</option>
                      <option value="european">מבטא אירופאי</option>
                      <option value="american">מבטא אמריקאי</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">תהודת קול</Label>
                    <select
                      value={resonance}
                      onChange={(e: any) => setResonance(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                    >
                      <option value="chest">תהודת חזה</option>
                      <option value="head">תהודת ראש</option>
                      <option value="nasal">תהודה אפית</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">הבעת רגש</Label>
                    <select
                      value={emotion}
                      onChange={(e: any) => setEmotion(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                    >
                      <option value="neutral">ניטרלי ושקול</option>
                      <option value="calm">רגוע ושלו</option>
                      <option value="excited">נלהב ונמרץ</option>
                      <option value="empathic">אמפתי ומזדהה</option>
                      <option value="assertive">אסרטיבי ובטוח</option>
                    </select>
                  </div>
                </div>

                {/* Pitch slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <Label className="font-semibold text-muted-foreground">גובה צליל (Pitch)</Label>
                    <span className="font-mono text-indigo-400 font-bold">{pitch[0]}%</span>
                  </div>
                  <Slider 
                    value={pitch}
                    max={100}
                    step={1}
                    onValueChange={setPitch}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                    <span>עמוק (בס)</span>
                    <span>ממוצע</span>
                    <span>גבוה (סופרן)</span>
                  </div>
                </div>

                {/* Speed slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <Label className="font-semibold text-muted-foreground">מהירות דיבור (Tempo)</Label>
                    <span className="font-mono text-indigo-400 font-bold">{speed[0]}%</span>
                  </div>
                  <Slider 
                    value={speed}
                    max={100}
                    step={1}
                    onValueChange={setSpeed}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                    <span>מתון / איטי</span>
                    <span>רגיל</span>
                    <span>מהיר / דינמי</span>
                  </div>
                </div>

              </div>

            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={createProfile}>צור פרופיל</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Grid display list */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-card text-center">
          <User className="w-12 h-12 text-muted-foreground mb-4 opacity-50 animate-pulse" />
          <h3 className="text-lg font-medium text-foreground">לא נמצאו פרופילי קול</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mb-4 text-xs">
            טרם יצרת פרופילי קול מאופיינים. הגדר את הפרופיל הראשון שלך כדי להתחיל ליצור ולסנתז שמע.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="text-xs">
            צור פרופיל ראשון
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => {
            const isSelected = selectedProfileId === profile.id;
            
            // Build defaults if missing in older profiles to prevent render crashes
            const pGender = profile.gender || 'neutral';
            const pAge = profile.ageGroup || 'mature';
            const pTone = profile.toneVibe || 'professional';
            const pAccent = profile.accent || 'standard';
            const pResonance = profile.resonance || 'chest';
            const pEmotion = profile.emotion || 'neutral';
            const pPitch = profile.pitch !== undefined ? profile.pitch : 50;
            const pSpeed = profile.speed !== undefined ? profile.speed : 50;

            return (
              <Card 
                key={profile.id} 
                id={`voice-profile-card-${profile.id}`}
                className={`overflow-hidden transition-all duration-300 relative group flex flex-col justify-between ${
                  isSelected 
                    ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md shadow-indigo-500/5 bg-gradient-to-br from-indigo-950/10 to-card' 
                    : 'hover:border-indigo-500/30'
                }`}
              >
                <CardHeader className="bg-muted/20 pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base flex items-center gap-2 font-bold">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-muted-foreground/10 text-muted-foreground'
                      }`}>
                        {isSelected ? <UserCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <span className="truncate max-w-[150px]">{profile.name}</span>
                    </CardTitle>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-indigo-400" 
                        onClick={() => openEditDialog(profile)}
                        title="ערוך אפיון קול"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-rose-500 opacity-50 hover:opacity-100" 
                        onClick={() => deleteProfile(profile.id)}
                        title="מחק פרופיל"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardDescription className="line-clamp-2 pt-1 text-xs">
                    {profile.description || 'לא סופק תיאור עבור מודל זה.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="py-3 space-y-4 flex-1">
                  
                  {/* Visual Parameters Grid / Tags */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded p-1.5 flex flex-col gap-0.5 text-right">
                      <span className="text-muted-foreground font-semibold">מין וגיל</span>
                      <span className="font-bold text-indigo-300">
                        {genderLabels[pGender]} • {ageLabels[pAge]}
                      </span>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded p-1.5 flex flex-col gap-0.5 text-right">
                      <span className="text-muted-foreground font-semibold">אווירה וסגנון</span>
                      <span className="font-bold text-indigo-300">
                        {toneLabels[pTone]}
                      </span>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded p-1.5 flex flex-col gap-0.5 text-right">
                      <span className="text-muted-foreground font-semibold">מבטא & תהודה</span>
                      <span className="font-bold text-indigo-300">
                        {accentLabels[pAccent]} • {resonanceLabels[pResonance]}
                      </span>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded p-1.5 flex flex-col gap-0.5 text-right">
                      <span className="text-muted-foreground font-semibold">הבעת רגש</span>
                      <span className="font-bold text-indigo-300">
                        {emotionLabels[pEmotion] || 'ניטרלי ושקול'}
                      </span>
                    </div>
                  </div>

                  {/* Pitch and Speed Mini-Indicators */}
                  <div className="space-y-2.5 pt-1">
                    {/* Pitch */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-muted-foreground">גובה צליל (Pitch)</span>
                        <span className="font-mono text-indigo-400 font-bold">{pPitch}%</span>
                      </div>
                      <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pPitch}%` }}
                        />
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-muted-foreground">מהירות (Tempo)</span>
                        <span className="font-mono text-indigo-400 font-bold">{pSpeed}%</span>
                      </div>
                      <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pSpeed}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </CardContent>

                <CardFooter className="pt-2 pb-4 px-4">
                  <Button 
                    variant={isSelected ? "secondary" : "default"} 
                    className={`w-full text-xs h-9 font-semibold ${
                      isSelected 
                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedProfileId(profile.id);
                      toast.info(`פרופיל פעיל: ${profile.name}`);
                    }}
                  >
                    {isSelected ? 'פרופיל פעיל במערכת' : 'בחר כפרופיל פעיל'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && setIsEditDialogOpen(false)}>
        <DialogContent className="max-w-[550px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit2 className="w-5 h-5 text-indigo-500" />
              עריכת אפיון פרופיל קול
            </DialogTitle>
            <DialogDescription className="text-xs">
              כייל מחדש את המאפיינים והפרמטרים הפיזיולוגיים של מודל קול זה.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm max-h-[420px] overflow-y-auto px-1">
            {/* Basic Meta fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">שם הפרופיל</Label>
                <Input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  dir="rtl"
                  className="h-9 text-xs"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-foreground">תיאור ואפיון קולי</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 gap-1"
                    onClick={() => {
                      const autoDesc = generateAutoDescription(
                        editName || 'קול מותאם',
                        editGender,
                        editAgeGroup,
                        editPitch[0],
                        editSpeed[0],
                        editToneVibe,
                        editAccent,
                        editResonance,
                        editEmotion
                      );
                      setEditDesc(autoDesc);
                      toast.success('התיאור האוטומטי נוצר בהצלחה!');
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                    ייצר תיאור אוטומטי
                  </Button>
                </div>
                <textarea 
                  placeholder="תיאור סגנון, גוון, מבטא ורגש (ניתן לכתוב ידנית או לייצר אוטומטית מתחת)" 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  dir="rtl"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-card px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3.5">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                כיול פרמטרים וסגנון
              </span>

              {/* Gender, Age, Tone Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">מגדר קולי</Label>
                  <select
                    value={editGender}
                    onChange={(e: any) => setEditGender(e.target.value)}
                    className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                  >
                    <option value="male">גברי</option>
                    <option value="female">נשי</option>
                    <option value="neutral">ניטרלי / מעורב</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">קבוצת גיל</Label>
                  <select
                    value={editAgeGroup}
                    onChange={(e: any) => setEditAgeGroup(e.target.value)}
                    className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                  >
                    <option value="young">צעיר (אנרגטי)</option>
                    <option value="mature">בוגר (סמכותי)</option>
                    <option value="elder">מבוגר (מיושב)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">טון ואווירה</Label>
                  <select
                    value={editToneVibe}
                    onChange={(e: any) => setEditToneVibe(e.target.value)}
                    className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                  >
                    <option value="professional">מקצועי ורשמי</option>
                    <option value="warm">חם וידידותי</option>
                    <option value="soft">רך ורגוע</option>
                    <option value="energetic">אנרגטי וקצבי</option>
                    <option value="dramatic">דרמטי ותיאטרלי</option>
                  </select>
                </div>
              </div>

              {/* Accent, Resonance & Emotion Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">מבטא והגייה</Label>
                  <select
                    value={editAccent}
                    onChange={(e: any) => setEditAccent(e.target.value)}
                    className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                  >
                    <option value="standard">עברית סטנדרטית</option>
                    <option value="oriental">מבטא מזרחי</option>
                    <option value="european">מבטא אירופאי</option>
                    <option value="american">מבטא אמריקאי</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">תהודת קול</Label>
                  <select
                    value={editResonance}
                    onChange={(e: any) => setEditResonance(e.target.value)}
                    className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                  >
                    <option value="chest">תהודת חזה</option>
                    <option value="head">תהודת ראש</option>
                    <option value="nasal">תהודה אפית</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">הבעת רגש</Label>
                  <select
                    value={editEmotion}
                    onChange={(e: any) => setEditEmotion(e.target.value)}
                    className="w-full h-8 rounded border border-input bg-card px-2 py-0.5 text-xs"
                  >
                    <option value="neutral">ניטרלי ושקול</option>
                    <option value="calm">רגוע ושלו</option>
                    <option value="excited">נלהב ונמרץ</option>
                    <option value="empathic">אמפתי ומזדהה</option>
                    <option value="assertive">אסרטיבי ובטוח</option>
                  </select>
                </div>
              </div>

              {/* Pitch slider */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <Label className="font-semibold text-muted-foreground">גובה צליל (Pitch)</Label>
                  <span className="font-mono text-indigo-400 font-bold">{editPitch[0]}%</span>
                </div>
                <Slider 
                  value={editPitch}
                  max={100}
                  step={1}
                  onValueChange={setEditPitch}
                  className="py-1"
                />
              </div>

              {/* Speed slider */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <Label className="font-semibold text-muted-foreground">מהירות דיבור (Tempo)</Label>
                  <span className="font-mono text-indigo-400 font-bold">{editSpeed[0]}%</span>
                </div>
                <Slider 
                  value={editSpeed}
                  max={100}
                  step={1}
                  onValueChange={setEditSpeed}
                  className="py-1"
                />
              </div>

            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>ביטול</Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={saveEditedProfile}>שמור שינויים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
