import { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { LayoutDashboard, Mic, Users, Settings2, Activity, Play, Wifi, WifiOff, Battery, BatteryCharging, Waves, Database } from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import AudioRecording from './components/AudioRecording';
import ProfileGallery from './components/ProfileGallery';
import SynthesisStudio from './components/SynthesisStudio';
import AnalysisDashboard from './components/AnalysisDashboard';
import SettingsDashboard from './components/SettingsDashboard';
import OnboardingGuide from './components/OnboardingGuide';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const { activeTab, setActiveTab, batterySaver, setBatterySaver } = useAppStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
    { id: 'record', label: 'הקלטת שמע', icon: Mic },
    { id: 'profiles', label: 'פרופילי קול', icon: Users },
    { id: 'synthesis', label: 'אולפן סינתזה', icon: Play },
    { id: 'analysis', label: 'ניתוח קולי', icon: Activity },
    { id: 'settings', label: 'הגדרות', icon: Settings2 },
  ] as const;

  const tabNames: Record<string, string> = {
    dashboard: 'לוח בקרה',
    record: 'הקלטת שמע',
    profiles: 'פרופילי קול',
    synthesis: 'אולפן סינתזה',
    analysis: 'ניתוח קולי',
    settings: 'הגדרות'
  };

  return (
    <div className="flex h-screen w-full bg-background font-sans text-foreground overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-l border-border bg-sidebar flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
             <Waves className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">VOCALIS</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-secondary/50 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="bg-secondary/30 rounded-lg p-3 flex items-center gap-3 border border-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600"></div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-semibold truncate">ד"ר שרה חן</p>
              <p className="text-[10px] text-muted-foreground">מדענית ראשית</p>
            </div>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {/* Desktop Header */}
        <header className="h-16 hidden md:flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-muted-foreground">בית / <span>{tabNames[activeTab]}</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setBatterySaver(!batterySaver)}
              className={cn("flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors", batterySaver ? "text-yellow-500" : "text-muted-foreground hover:text-foreground")}
              title="חיסכון בסוללה (מפחית קצב רענון)"
            >
              {batterySaver ? <BatteryCharging className="w-4 h-4" /> : <Battery className="w-4 h-4" />}
              <span>חיסכון סוללה {batterySaver ? "פועל" : "כבוי"}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")}></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                מערכת {isOnline ? "מקוונת" : "לא מקוונת"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              סנכרון ענן: <span className={cn(isOnline ? "text-primary" : "text-muted-foreground")}>{isOnline ? "פעיל" : "מושהה"}</span>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Waves className="w-5 h-5" />
            VOCALIS
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setBatterySaver(!batterySaver)}
               className={cn("flex items-center justify-center transition-colors", batterySaver ? "text-yellow-500" : "text-muted-foreground")}
               title="חיסכון בסוללה"
             >
               {batterySaver ? <BatteryCharging className="w-5 h-5" /> : <Battery className="w-5 h-5" />}
             </button>
             {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 md:p-8 h-full max-w-7xl">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'record' && <AudioRecording />}
            {activeTab === 'profiles' && <ProfileGallery />}
            {activeTab === 'synthesis' && <SynthesisStudio />}
            {activeTab === 'analysis' && <AnalysisDashboard />}
            {activeTab === 'settings' && <SettingsDashboard />}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around p-3 border-t border-border bg-sidebar safe-area-pb shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors",
                  activeTab === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden xs:block">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
      <Toaster theme="dark" dir="rtl" />
      <OnboardingGuide />
    </div>
  );
}
