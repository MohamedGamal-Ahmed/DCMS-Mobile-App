
import React, { useState, useEffect } from 'react';
import { initialCorrespondences, initialMeetings } from './mockData';
import { Correspondence, Meeting, User, Stats, ApiResponse, LoginResponse } from './types';
import SearchModule from './components/SearchModule';
import MeetingsModule from './components/MeetingsModule';

type Tab = 'home' | 'agenda' | 'profile';

// امسح السطر القديم وحط ده مكانه:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ meetingsToday: 0, pendingIssues: 0, completedReports: 0 });
  const [selectedItem, setSelectedItem] = useState<Correspondence | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // PWA Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dcms_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('dcms_user');
      }
    }
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch data when user changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userId = user?.id;
        const url = userId
          ? `${API_BASE}/Mobile/GetData?userId=${userId}`
          : `${API_BASE}/Mobile/GetData`;

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'ngrok-skip-browser-warning': '69420'
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const data: ApiResponse = await response.json();
          setCorrespondences(data.correspondences || []);
          setMeetings(data.meetings || []);
          if (data.stats) setStats(data.stats);
        } else {
          // Try to read error message from JSON body
          try {
            const errorData = await response.json();
            setError(errorData.message || 'فشل جلب البيانات من الخادم (Status: ' + response.status + ')');
          } catch (e) {
            setError(`فشل جلب البيانات من الخادم (Status: ${response.status})`);
          }
          setCorrespondences([]);
          setMeetings([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('فشل الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت.');
        setCorrespondences([]);
        setMeetings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch(`${API_BASE}/Mobile/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('dcms_user', JSON.stringify(data.user));
        setActiveTab('home');
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setLoginError(data.message || 'خطأ في تسجيل الدخول');
      }
    } catch (error) {
      setLoginError('فشل الاتصال بالخادم');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dcms_user');
    setActiveTab('profile');
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleOpenPdf = (url?: string) => {
    if (!url) return;
    const fullUrl = url.startsWith('http')
      ? url
      : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
    window.open(fullUrl, '_blank');
  };

  const renderContent = () => {
    // Not logged in - show login on profile tab
    if (!user && activeTab === 'profile') {
      return (
        <div className="animate-fade-in px-6 py-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald/10 rounded-3xl flex items-center justify-center text-emerald mb-8 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">تسجيل الدخول</h2>
          <p className="text-gray-400 font-bold text-sm mb-10 text-center">يرجى إدخال بيانات الاعتماد الخاصة بك للوصول إلى نظام المراسلات</p>

          {loginError && (
            <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold text-center">
              {loginError}
            </div>
          )}

          <form className="w-full space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500 pr-1">اسم المستخدم</label>
              <input
                type="text"
                placeholder="username"
                className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl text-sm focus:border-emerald outline-none shadow-sm transition-all"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500 pr-1">كلمة المرور</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl text-sm focus:border-emerald outline-none shadow-sm transition-all"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-16 bg-emerald text-white rounded-[24px] font-black text-base shadow-xl shadow-emerald/20 active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
            >
              {isLoggingIn ? 'جاري الدخول...' : 'دخول النظام'}
            </button>
          </form>
          <p className="mt-8 text-[11px] font-bold text-gray-400">نسيت كلمة المرور؟ تواصل مع الدعم الفني</p>
        </div>
      );
    }

    // Not logged in - show restricted access on other tabs
    if (!user) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center px-10 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">الوصول مقيد</h3>
          <p className="text-sm font-bold text-gray-400">يرجى تسجيل الدخول أولاً لعرض البيانات</p>
          <button
            onClick={() => setActiveTab('profile')}
            className="mt-6 px-8 py-3 bg-emerald text-white rounded-xl font-black text-sm shadow-lg shadow-emerald/10"
          >
            الانتقال لصفحة الدخول
          </button>
        </div>
      );
    }

    // Logged in - show content
    switch (activeTab) {
      case 'home':
        return (
          <main className="animate-fade-in space-y-8 py-2">
            {/* Install Banner */}
            {showInstallBanner && (
              <div className="mx-5 bg-gradient-to-r from-emerald to-emerald/80 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">ثبّت التطبيق</p>
                    <p className="text-white/70 text-[10px]">أضف التطبيق للشاشة الرئيسية</p>
                  </div>
                </div>
                <button
                  onClick={handleInstallApp}
                  className="bg-white text-emerald px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  تثبيت
                </button>
              </div>
            )}

            <div className="px-5 mt-4">
              <h2 className="text-xl font-black text-gray-900 leading-tight">
                أهلاً بك، {user.name}
              </h2>
              <div className="w-10 h-1.5 bg-emerald rounded-full mt-1.5 shadow-sm shadow-emerald/10"></div>
            </div>

            {error ? (
              <div className="mx-5 p-6 bg-red-50 border border-red-100 rounded-[32px] text-center space-y-4 shadow-sm animate-fade-in">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-900 mb-1">خطأ في جلب البيانات</h3>
                  <p className="text-[11px] font-bold text-red-600/70">{error}</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-200 active:scale-95 transition-all"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <>
                <MeetingsModule meetings={meetings} loading={isLoading} viewType="home" />
                <div className="space-y-4">
                  <div className="px-5">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-r-4 border-emerald pr-3">المراسلات الأخيرة</h3>
                  </div>
                  <SearchModule data={correspondences} loading={isLoading} onSelectItem={setSelectedItem} />
                </div>
              </>
            )}
          </main>
        );
      case 'agenda':
        return <MeetingsModule meetings={meetings} loading={isLoading} viewType="agenda" />;
      case 'profile':
        return (
          <div className="animate-fade-in px-5 py-8 space-y-8">
            {/* Digital ID Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-100 border border-gray-50 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald/5 rounded-full -mr-12 -mt-12"></div>
              <div className="w-24 h-24 bg-emerald/10 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg relative z-10">
                <svg className="w-12 h-12 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border-2 border-emerald p-1 flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-emerald" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
              <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-wider">{user.role}</p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                <span className="text-[18px] font-black text-emerald block">{stats.meetingsToday.toString().padStart(2, '0')}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-tight">اجتماعاتي اليوم</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                <span className="text-[18px] font-black text-blue-600 block">{stats.pendingIssues.toString().padStart(2, '0')}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-tight">مواضيع معلقة</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                <span className="text-[18px] font-black text-purple-600 block">{stats.completedReports}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-tight">تقارير منجزة</span>
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">أمان الحساب</h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">تنبيهات الدخول</span>
                    <span className="text-[10px] text-gray-400">إشعار عند كل دخول جديد للحساب</span>
                  </div>
                  <div className="w-12 h-6 bg-emerald rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">وضع توفير البيانات</span>
                  <button
                    onClick={() => setDataSaver(!dataSaver)}
                    className={`w-12 h-6 rounded-full transition-all relative ${dataSaver ? 'bg-emerald' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${dataSaver ? 'right-1' : 'right-7'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* PWA Install */}
            {deferredPrompt ? (
              <button
                onClick={handleInstallApp}
                className="w-full py-5 bg-emerald text-white rounded-[24px] text-base font-black shadow-lg shadow-emerald/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                تثبيت التطبيق على الموبايل
              </button>
            ) : (
              /* iOS Specific Notification */
              /iPhone|iPad|iPod/.test(navigator.userAgent) && !((window.navigator as any).standalone) && (
                <div className="w-full p-6 bg-blue-50 border border-blue-100 rounded-[28px] space-y-3">
                  <div className="flex items-center gap-3 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-black text-sm">للتثبيت على iPhone</span>
                  </div>
                  <p className="text-[11px] text-blue-500 font-bold leading-relaxed">
                    اضغط على زر <span className="p-1 bg-white rounded border border-blue-200">مشاركة (Share)</span> في متصفح Safari، ثم اختر <span className="px-2 py-0.5 bg-white rounded border border-blue-200">Add to Home Screen</span>.
                  </p>
                </div>
              )
            )}

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="w-full py-5 bg-red-50 text-red-600 rounded-[24px] text-base font-black border border-red-100 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              تسجيل خروج آمن
            </button>

            <div className="text-center pb-6">
              <p className="text-[13px] font-black text-black mb-2">Developed By : Mohamed Gamal 2026</p>
              <div className="opacity-30">
                <p className="text-[10px] font-black text-gray-400 tracking-widest">DCMS VIEWER HUB V4.0.8</p>
                <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase text-center">Digital Correspondence & Meeting System</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFE] pb-32">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-50 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald rounded-xl flex items-center justify-center text-white font-black text-lg shadow shadow-emerald/10">
            D
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight">DCMS Hub</h1>
            <span className="text-[9px] font-bold text-emerald uppercase tracking-widest mt-0.5">Mobile Viewer</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 relative border border-gray-100 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v1m6 0H9" />
            </svg>
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      {renderContent()}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-inner" onClick={() => setSelectedItem(null)}></div>
          <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 pb-12 relative animate-slide-up shadow-2xl border-t border-gray-100 flex flex-col gap-6">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto -mt-2"></div>

            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <span className="text-[11px] font-black text-emerald bg-emerald/5 px-2.5 py-1 rounded-lg border border-emerald/10 uppercase tracking-widest">
                  {selectedItem.referenceNumber}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border border-gray-100 uppercase tracking-widest ${selectedItem.category === 'Inbound' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {selectedItem.category === 'Inbound' ? 'وارد' : 'صادر'}
                </span>
              </div>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${selectedItem.status === 'New' ? 'text-yellow-700 bg-yellow-50 border-yellow-100' : 'text-gray-500 bg-gray-50 border-gray-100'}`}>
                {selectedItem.status === 'New' ? 'جديد' : 'معالج'}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-black text-gray-900 leading-tight">{selectedItem.subject}</h3>
              <div className="flex items-center gap-3 text-gray-400 font-bold text-xs uppercase tracking-wider">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {selectedItem.date} • {selectedItem.responsibleEngineer}
              </div>
            </div>

            <div className="h-px bg-gray-50"></div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">التفاصيل والملاحظات</h4>
              <div className="bg-gray-50/50 p-5 rounded-[24px] border border-gray-100/50">
                <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedItem.description || "لا يوجد تفاصيل إضافية مسجلة لهذا الموضوع."}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">المرفقات المتاحة</h4>
              <div className="grid grid-cols-1 gap-3">
                {selectedItem.attachments && selectedItem.attachments.length > 0 ? (
                  selectedItem.attachments.map((att, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOpenPdf(att.url)}
                      className={`w-full h-18 bg-white border-2 p-4 rounded-2xl flex items-center justify-between transition-all shadow-sm active:scale-[0.98] ${att.type === 'original' ? 'border-emerald/20 hover:bg-emerald/5' :
                        att.type === 'reply' ? 'border-blue-100 hover:bg-blue-50' :
                          att.type === 'transfer' ? 'border-amber-100 hover:bg-amber-50' :
                            'border-gray-100 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${att.type === 'original' ? 'bg-emerald/10 text-emerald' :
                          att.type === 'reply' ? 'bg-blue-50 text-blue-600' :
                            att.type === 'transfer' ? 'bg-amber-50 text-amber-600' :
                              'bg-gray-50 text-gray-400'
                          }`}>
                          {att.type === 'original' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          ) : att.type === 'reply' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          ) : att.type === 'transfer' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          )}
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-sm font-black text-gray-900">{att.title}</span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {att.type === 'original' ? 'عرض المرفق الأساسي' :
                              att.type === 'reply' ? 'عرض ملف الرد المباشر' :
                                att.type === 'transfer' ? 'عرض مرفق التأشيرة/التحويل' :
                                  'مرفق إضافي متاح للموضوع'}
                          </span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400">لا توجد ملفات مرفقة متاحة حالياً</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-5 bg-gray-900 text-white rounded-[28px] font-black text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all mt-4"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 h-22 bg-white/95 backdrop-blur-md border-t border-gray-100 px-10 flex items-center justify-between z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-4">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1.5 transition-all relative ${activeTab === 'home' ? 'text-emerald' : 'text-gray-300'}`}
        >
          {activeTab === 'home' && <div className="absolute -top-[16px] w-10 h-1.5 bg-emerald rounded-full"></div>}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[11px] font-black">الرئيسية</span>
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1.5 transition-all relative ${activeTab === 'agenda' ? 'text-emerald' : 'text-gray-300'}`}
        >
          {activeTab === 'agenda' && <div className="absolute -top-[16px] w-10 h-1.5 bg-emerald rounded-full"></div>}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[11px] font-black">الأجندة</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1.5 transition-all relative ${activeTab === 'profile' ? 'text-emerald' : 'text-gray-300'}`}
        >
          {activeTab === 'profile' && <div className="absolute -top-[16px] w-10 h-1.5 bg-emerald rounded-full"></div>}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[11px] font-black">الملف</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
