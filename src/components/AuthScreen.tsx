import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Waves, Sparkles, User, ShieldAlert, KeyRound, ArrowLeft, ArrowRight, Briefcase } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: { username: string; fullName: string; role: string }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('מרצה');

  const getStoredUsers = () => {
    const users = localStorage.getItem('vocalis_users');
    if (!users) {
      // Default initial users
      const initial = [
        { username: 'admin', password: '123', fullName: 'שרה חן', role: 'מנהלת פדגוגית' },
        { username: 'rav_avrohom', password: '123', fullName: 'הרב אברהם שליט"א', role: 'ראש ישיבה' }
      ];
      localStorage.setItem('vocalis_users', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(users);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('אנא מלא שם משתמש וקוד גישה');
      return;
    }

    const users = getStoredUsers();
    const found = users.find(
      (u: any) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim()
    );

    if (found) {
      localStorage.setItem('vocalis_session', JSON.stringify(found));
      toast.success(`ברוך הבא, ${found.fullName}!`);
      onLoginSuccess(found);
    } else {
      toast.error('שם משתמש או קוד גישה שגויים');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      toast.error('אנא מלא את כל השדות');
      return;
    }

    const users = getStoredUsers();
    const exists = users.some((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());

    if (exists) {
      toast.error('שם משתמש זה כבר קיים במערכת');
      return;
    }

    const newUser = {
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      role: role
    };

    const updated = [...users, newUser];
    localStorage.setItem('vocalis_users', JSON.stringify(updated));
    localStorage.setItem('vocalis_session', JSON.stringify(newUser));
    
    toast.success('הרשמתך בוצעה בהצלחה!');
    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#FFECEC] via-[#F2F4FF] to-[#E3F6FF] p-4 text-right overflow-y-auto" dir="rtl">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob [animation-delay:2s]"></div>
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-amber-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob [animation-delay:4s]"></div>

      <Card className="w-full max-w-md border border-white/50 bg-white/75 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden relative z-10 transition-all duration-300">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-3">
            {/* Soft Pastel Gradient Logo Container */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD1D1] via-[#DCE1FC] to-[#C9EFFF] flex items-center justify-center shadow-md border border-white/60">
              <Waves className="w-8 h-8 text-indigo-500/80" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            מערכת קולית VOCALIS
          </CardTitle>
          <CardDescription className="text-xs text-indigo-950/60 font-medium mt-1">
            {isRegister ? 'הרשמת משתמש חדש במאגר' : 'כניסה למערכת אפיון וסנכרון קולי'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 py-2">
          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-indigo-950/70">שם מלא (כולל תואר)</Label>
                <div className="relative">
                  <Input
                    placeholder="למשל: הרב מאיר לוי שליט&quot;א"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-9 text-xs h-10 border-indigo-100 bg-white/50 focus:bg-white text-right"
                    required
                  />
                  <User className="absolute right-3 top-3 w-4 h-4 text-indigo-400" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-indigo-950/70">שם משתמש</Label>
              <div className="relative">
                <Input
                  placeholder="הזן שם משתמש באנגלית או עברית"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-9 text-xs h-10 border-indigo-100 bg-white/50 focus:bg-white text-right"
                  required
                />
                <User className="absolute right-3 top-3 w-4 h-4 text-indigo-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-indigo-950/70">קוד גישה / סיסמה</Label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="הזן קוד גישה למערכת"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 text-xs h-10 border-indigo-100 bg-white/50 focus:bg-white text-right font-mono"
                  required
                />
                <KeyRound className="absolute right-3 top-3 w-4 h-4 text-indigo-400" />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-indigo-950/70">תפקיד / זיקה מקצועית</Label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 pr-9 pl-3 rounded-md border border-indigo-100 bg-white/50 focus:bg-white text-xs text-indigo-950"
                  >
                    <option value="ראש ישיבה">ראש ישיבה</option>
                    <option value="מרצה / דרשן">מרצה / דרשן</option>
                    <option value="מלמד בחדר">מלמד בחדר</option>
                    <option value="קריין">קריין מקצועי</option>
                    <option value="מנהל פדגוגי">מנהל פדגוגי</option>
                    <option value="אורח">אורח / משתמש כללי</option>
                  </select>
                  <Briefcase className="absolute right-3 top-3 w-4 h-4 text-indigo-400 pointer-events-none" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white shadow-lg shadow-indigo-200 font-bold text-xs h-10 mt-2">
              {isRegister ? 'שלם הרשמה וכנס למערכת' : 'כנס למערכת'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-indigo-50/50 bg-indigo-50/20 py-4 mt-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setUsername('');
              setPassword('');
              setFullName('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
          >
            {isRegister ? (
              <>
                כבר רשום? כנס כאן
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                טרם נרשמת? צור חשבון חדש
                <ArrowLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
