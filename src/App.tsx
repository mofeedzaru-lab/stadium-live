import { useState, useEffect } from "react";
import { 
  Tv, 
  Activity, 
  Film, 
  Search, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Clock, 
  MapPin, 
  Info,
  Calendar,
  Layers,
  ArrowRight,
  X,
  Sun,
  Moon
} from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";
import AdminPanel from "./components/AdminPanel";
import { 
  Channel, 
  LiveMatch, 
  Movie, 
  Series, 
  Season, 
  Episode,
  ChannelCategory,
  MatchStatus
} from "./types";
import { 
  fetchChannels, 
  fetchMatches, 
  fetchMovies, 
  fetchSeries, 
  fetchSeasons, 
  fetchEpisodes 
} from "./db";

export default function App() {
  // DB States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Navigation Tabs: 'channels' | 'matches' | 'on_demand'
  type AppTab = "channels" | "matches" | "on_demand";
  const [activeTab, setActiveTab] = useState<AppTab>("channels");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [onDemandFilter, setOnDemandFilter] = useState<"all" | "movies" | "series">("all");

  // Player state
  const [activeStream, setActiveStream] = useState<{
    id: string;
    title: string;
    subTitle?: string;
    streamUrl: string;
    posterUrl?: string;
    type: "channel" | "match" | "movie" | "episode";
    // Metadata for episode stepper
    episodeId?: string;
    seasonId?: string;
    seriesId?: string;
  } | null>(null);

  // Detail Modal States
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  // Admin visibility
  const [showAdmin, setShowAdmin] = useState(false);

  // Light/Dark theme state, defaulting to light mode (false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("staad_theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    localStorage.setItem("staad_theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // UTILS: Arabic translation helpers
  const translateCategory = (cat: string) => {
    switch(cat) {
      case "sports": return "رياضية";
      case "news": return "إخبارية";
      case "general": return "عامة";
      default: return cat;
    }
  };

  // Synchronizers
  const refreshAllData = async () => {
    try {
      const fc = await fetchChannels();
      const fm = await fetchMatches();
      const fmv = await fetchMovies();
      const fs = await fetchSeries();
      const fss = await fetchSeasons();
      const fep = await fetchEpisodes();

      setChannels(fc);
      setMatches(fm);
      setMovies(fmv);
      setSeries(fs);
      setSeasons(fss);
      setEpisodes(fep);
    } catch(err) {
      console.error("Database connection failed, using offline fallback profiles:", err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Set default season selection when a series is selected
  useEffect(() => {
    if (selectedSeries) {
      const seriesSeasons = seasons.filter(s => s.seriesId === selectedSeries.id);
      if (seriesSeasons.length > 0) {
        setSelectedSeasonId(seriesSeasons[0].id);
      } else {
        setSelectedSeasonId("");
      }
    }
  }, [selectedSeries, seasons]);

  // Handle stream trigger
  const playChannelStream = (chn: Channel) => {
    setActiveStream({
      id: chn.id,
      title: chn.name,
      subTitle: `قناة بث مباشر • ${translateCategory(chn.category)}`,
      streamUrl: chn.streamUrl,
      posterUrl: chn.logoUrl,
      type: "channel"
    });
    // Smooth scroll back to top of page/player
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const playMatchStream = (match: LiveMatch) => {
    setActiveStream({
      id: match.id,
      title: match.title,
      subTitle: `${match.tournamentName} • بث مباشر للمباراة`,
      streamUrl: match.streamUrl,
      type: "match"
    });
    setSelectedMatch(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const playMovieStream = (movie: Movie) => {
    setActiveStream({
      id: movie.id,
      title: movie.title,
      subTitle: "فيلم حسب الطلب (VOD)",
      streamUrl: movie.videoUrl,
      posterUrl: movie.posterUrl,
      type: "movie"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const playEpisodeStream = (ep: Episode) => {
    const sName = seasons.find(s => s.id === ep.seasonId)?.title || "الموسم المالي";
    const serName = series.find(s => s.id === ep.seriesId)?.title || "المسلسل";
    
    setActiveStream({
      id: ep.id,
      title: ep.title,
      subTitle: `${serName} • ${sName}`,
      streamUrl: ep.videoUrl,
      type: "episode",
      episodeId: ep.id,
      seasonId: ep.seasonId,
      seriesId: ep.seriesId
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // EPISODE SYSTEM: Next & Previous Navigations
  const handleNextEpisode = () => {
    if (!activeStream || activeStream.type !== "episode" || !activeStream.episodeId) return;
    
    // Find all episodes under current season sorted by episode number
    const currentEpisodes = episodes
      .filter(e => e.seasonId === activeStream.seasonId)
      .sort((a,b) => a.episodeNumber - b.episodeNumber);
    
    const currentIndex = currentEpisodes.findIndex(e => e.id === activeStream.episodeId);
    if (currentIndex >= 0 && currentIndex < currentEpisodes.length - 1) {
      playEpisodeStream(currentEpisodes[currentIndex + 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (!activeStream || activeStream.type !== "episode" || !activeStream.episodeId) return;
    
    const currentEpisodes = episodes
      .filter(e => e.seasonId === activeStream.seasonId)
      .sort((a,b) => a.episodeNumber - b.episodeNumber);
    
    const currentIndex = currentEpisodes.findIndex(e => e.id === activeStream.episodeId);
    if (currentIndex > 0) {
      playEpisodeStream(currentEpisodes[currentIndex - 1]);
    }
  };

  // Stepper calculations
  const isNextEpisodeAvailable = () => {
    if (!activeStream || activeStream.type !== "episode" || !activeStream.episodeId) return false;
    const currentEpisodes = episodes.filter(e => e.seasonId === activeStream.seasonId);
    const epObj = currentEpisodes.find(e => e.id === activeStream.episodeId);
    if (!epObj) return false;
    return currentEpisodes.some(e => e.episodeNumber > epObj.episodeNumber);
  };

  const isPrevEpisodeAvailable = () => {
    if (!activeStream || activeStream.type !== "episode" || !activeStream.episodeId) return false;
    const currentEpisodes = episodes.filter(e => e.seasonId === activeStream.seasonId);
    const epObj = currentEpisodes.find(e => e.id === activeStream.episodeId);
    if (!epObj) return false;
    return currentEpisodes.some(e => e.episodeNumber < epObj.episodeNumber);
  };

  // Filter lists based on Search Query and select codes
  const filteredChannels = channels.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubCat = channelFilter === "all" || c.category === channelFilter;
    return matchSearch && matchSubCat;
  });

  const filteredMatches = matches.filter(m => {
    return m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.tournamentName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMovies = movies.filter(m => {
    return m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredSeries = series.filter(s => {
    return s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`${isDarkMode ? "dark" : ""} min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white`} dir="rtl">
      
      {/* 1. Header Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800/80 sticky top-0 z-40 px-3 md:px-8 py-1.5 md:py-2.5 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between shadow-lg">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <Tv className="w-4 h-4 md:w-6 md:h-6 stroke-2 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-black tracking-tight text-slate-150 flex items-center gap-1.5">
                إستاد تي في
                <span className="text-[9px] md:text-[11px] text-blue-400 font-bold tracking-widest uppercase">Staad TV</span>
              </h1>
              <p className="text-[8px] md:text-[10px] text-slate-400 font-medium leading-none">مباريات جارية وبث مباشر متميز</p>
            </div>
          </div>

          {/* Mobile Controls Group */}
          <div className="md:hidden flex items-center gap-1.5">
            {/* Theme switcher */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition cursor-pointer text-slate-300"
              title={isDarkMode ? "التحويل للوضع النهاري" : "التحويل للوضع الليلي"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            </button>

            {/* Secret/Hidden Admin button for secure authorization */}
            <button
              onClick={() => setShowAdmin(true)}
              id="admin-console-trigger"
              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-bold border border-slate-700/60 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>المدير</span>
            </button>
          </div>
        </div>

        {/* Global Finder Search bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 md:right-3.5 md:top-3 md:w-4 md:h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن قناة، مباراة، مسلسل أو فيلم..."
            className="w-full pl-3 pr-8 md:pl-4 md:pr-10 py-1 md:py-2.5 bg-slate-950/80 hover:bg-slate-950 text-slate-100 text-xs md:text-sm rounded-lg md:rounded-xl border border-slate-800 transition-all outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Desktop Navbar Controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Switcher Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-xs text-slate-300 font-bold border border-slate-700/60 transition-all cursor-pointer shadow-sm active:scale-95"
            title={isDarkMode ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-yellow-400" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>الوضع الليلي</span>
              </>
            )}
          </button>

          {/* Active UTC status clock */}
          <div className="text-right flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/60 text-slate-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>2026-06-01</span>
          </div>

          <button
            onClick={() => setShowAdmin(true)}
            id="admin-console-trigger-desktop"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-blue-600 hover:text-white rounded-xl text-xs text-slate-300 font-bold border border-slate-700/60 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400 transition group-hover:text-white" />
            <span>لوحة تحكم المسؤول</span>
          </button>
        </div>
      </header>

      {/* 2. Primary Media Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 md:p-6 space-y-4 md:space-y-6">

        {/* High-Fidelity IPTV Live TV Screen Frame */}
        {activeStream && (
          <section id="media-live-screen-viewport" className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start animate-fade-in">
            
            {/* Left Player Space Column (2 cols width on screens) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="space-y-2">
                {/* Close player header bar */}
                <div className="flex items-center justify-between bg-slate-905 border border-slate-800 p-2 md:p-3 rounded-lg md:rounded-2xl shadow-xl">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-350">أنت تشاهد حالياً:</span>
                    <span className="text-[10px] md:text-xs font-extrabold text-blue-400 truncate max-w-[120px] sm:max-w-xs">{activeStream.title}</span>
                  </div>
                  <button
                    onClick={() => setActiveStream(null)}
                    className="px-2 py-1 md:px-3 md:py-1.5 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 hover:border-red-500/20 text-[10px] md:text-xs font-extrabold text-slate-200 rounded-lg md:rounded-xl transition cursor-pointer flex items-center gap-1 active:scale-95"
                    title="الرجوع للرئيسية وإغلاق البث"
                  >
                    <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span>إغلاق</span>
                  </button>
                </div>

                <VideoPlayer
                  src={activeStream.streamUrl}
                  title={activeStream.title}
                  subTitle={activeStream.subTitle}
                  poster={activeStream.posterUrl}
                />
                
                {/* Steppers in case of actively playing TV Series Episode */}
                {activeStream.type === "episode" && (
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-100 animate-fade-in shadow-lg">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">الحلقة المشغلة حالياً</span>
                      <h4 className="font-extrabold text-sm text-slate-100 leading-tight">{activeStream.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{activeStream.subTitle}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handlePrevEpisode}
                        disabled={!isPrevEpisodeAvailable()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-300 border border-slate-700/60 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>الحلقة السابقة</span>
                      </button>

                      <button
                        onClick={handleNextEpisode}
                        disabled={!isNextEpisodeAvailable()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/10"
                      >
                        <span>الحلقة التالية</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Highlights & Currently Live Quick-List Menu */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl self-stretch flex flex-col h-full max-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-black text-slate-150 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  مباريات جارية الآن المباشرة
                </h3>
                <button 
                  onClick={() => { setActiveTab("matches"); }}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  المزيد
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-thin">
                {matches.filter(m => m.status === MatchStatus.LIVE).length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Activity className="w-8 h-8 text-slate-700 mx-auto" />
                    <p className="text-xs font-medium">لا توجد مباريات جارية حالياً.</p>
                    <button 
                      onClick={() => setActiveTab("matches")}
                      className="text-[11px] text-blue-400 underline font-bold mt-2"
                    >
                      تصفح جدول المباريات المكتملة
                    </button>
                  </div>
                ) : (
                  matches.filter(m => m.status === MatchStatus.LIVE).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => playMatchStream(item)}
                      className="group bg-slate-950 hover:bg-slate-900 rounded-xl border border-slate-850/80 p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-98"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.2 rounded-full font-bold animate-pulse">مباشر الآن</span>
                        <span className="font-bold">{item.tournamentName}</span>
                      </div>

                      <div className="flex justify-between items-center my-3 text-center gap-2">
                        <div className="flex flex-col sm:flex-row items-center gap-1.5 flex-1 justify-center min-w-0">
                          {item.teamHomeLogo ? (
                            <img src={item.teamHomeLogo} alt={item.teamHome} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-700/60" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 font-black text-[9px] flex items-center justify-center shrink-0 border border-blue-500/40">H</div>
                          )}
                          <span className="text-xs font-black text-slate-200 truncate">{item.teamHome}</span>
                        </div>
                        
                        <div className="flex flex-col items-center shrink-0 mx-2">
                          <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-lg font-mono">
                            {item.scoreHome !== undefined ? item.scoreHome : 0} - {item.scoreAway !== undefined ? item.scoreAway : 0}
                          </span>
                          <span className="text-[8px] text-slate-500 uppercase mt-0.5 font-bold">بث مباشر</span>
                        </div>

                        <div className="flex flex-col sm:flex-row-reverse items-center gap-1.5 flex-1 justify-center min-w-0">
                          {item.teamAwayLogo ? (
                            <img src={item.teamAwayLogo} alt={item.teamAway} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-700/60" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-orange-600/30 text-orange-400 font-black text-[9px] flex items-center justify-center shrink-0 border border-orange-500/40">A</div>
                          )}
                          <span className="text-xs font-black text-slate-200 truncate">{item.teamAway}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-900 text-[10px]">
                        <span className="text-slate-400 truncate line-clamp-1 max-w-[160px]">{item.title}</span>
                        <span className="text-blue-400 font-bold flex items-center gap-0.5">
                          <Play className="w-3 h-3 fill-current" />
                          بث فوري
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* 3. Main Sections Filter Navigation Tabs */}
        <section id="category-navigation-tabs" className="bg-slate-900 border border-slate-800 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-lg overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2 w-full min-w-max">
            <button
              onClick={() => { setActiveTab("channels"); setSearchQuery(""); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-[10px] sm:text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "channels" 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15" 
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Tv className="w-3 h-3 sm:w-4 h-4 shrink-0" />
              <span>البث التلفزيوني (قنوات)</span>
            </button>

            <button
              onClick={() => { setActiveTab("matches"); setSearchQuery(""); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-[10px] sm:text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "matches" 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15" 
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Activity className="w-3 h-3 sm:w-4 h-4 shrink-0" />
              <span>المباريات المباشرة</span>
            </button>

            <button
              onClick={() => { setActiveTab("on_demand"); setSearchQuery(""); setSelectedSeries(null); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-[10px] sm:text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "on_demand" 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15" 
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Film className="w-3 h-3 sm:w-4 h-4 shrink-0" />
              <span>أفلام ومسلسلات (VOD)</span>
            </button>
          </div>
        </section>

        {/* 4. Sub-Tab dynamic render workspaces */}

        {/* SECTION A: CHANNELS (قنوات) */}
        {activeTab === "channels" && (
          <div id="channels-section-grid" className="space-y-6">
            
            {/* Filter buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setChannelFilter("all")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer select-none whitespace-nowrap ${
                  channelFilter === "all" 
                    ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                    : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setChannelFilter(ChannelCategory.SPORTS)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer select-none whitespace-nowrap ${
                  channelFilter === ChannelCategory.SPORTS 
                    ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                    : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                }`}
              >
                قنوات رياضية (Sports)
              </button>
              <button
                onClick={() => setChannelFilter(ChannelCategory.NEWS)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer select-none whitespace-nowrap ${
                  channelFilter === ChannelCategory.NEWS 
                    ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                    : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                }`}
              >
                قنوات إخبارية (News)
              </button>
              <button
                onClick={() => setChannelFilter(ChannelCategory.GENERAL)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer select-none whitespace-nowrap ${
                  channelFilter === ChannelCategory.GENERAL 
                    ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                    : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                }`}
              >
                قنوات عامة (General)
              </button>
            </div>

            {/* Channels card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredChannels.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500">
                  <Tv className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-bold">لا توجد قنوات تطابق فلاتر البحث حالياً.</p>
                </div>
              ) : (
                filteredChannels.map((chn) => (
                  <div
                    key={chn.id}
                    onClick={() => playChannelStream(chn)}
                    className={`group relative bg-slate-900/40 hover:bg-slate-900 hover:border-blue-500/50 rounded-2xl border transition-all duration-300 p-4 flex flex-col items-center justify-between text-center cursor-pointer select-none ${
                      activeStream?.id === chn.id ? "border-blue-500 bg-blue-500/5" : "border-slate-850"
                    }`}
                  >
                    {/* Channel Category sticker */}
                    <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800/80 text-blue-400">
                      {translateCategory(chn.category)}
                    </span>

                    {/* Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center p-2 mb-3 mt-2 border border-slate-850 group-hover:scale-105 transition-all">
                      <img
                        src={chn.logoUrl}
                        alt={chn.name}
                        className="w-full h-full object-cover rounded-lg bg-slate-900"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1540747737956-378724044453?w=150&auto=format&fit=crop&q=60"; }}
                      />
                    </div>

                    {/* Name */}
                    <h4 className="font-extrabold text-xs text-slate-150 group-hover:text-blue-400 line-clamp-1 transition-colors">{chn.name}</h4>

                    <span className="text-[9px] mt-2 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-850/80 text-slate-500 group-hover:text-slate-350 transition-colors">
                      شغل البث
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION B: LIVE MATCHES (المباريات المباشرة) */}
        {activeTab === "matches" && (
          <div id="matches-section-grid" className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-md font-bold text-slate-150">جدول وتحليل المباريات المباشرة</h3>
                <p className="text-xs text-slate-400">تابع تغطيات البث المباشرة وأوقات بدء الأستوديوهات التحليلية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500">
                  <Activity className="w-12 h-12 text-slate-700 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-bold">عذراً، لم نجد قنوات مباريات مسجلة ومطابقة لبحثك.</p>
                </div>
              ) : (
                filteredMatches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMatch(item)}
                    className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-850/80 hover:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="space-y-2.5 text-right flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'live' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : item.status === 'finished' 
                            ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.status === 'live' ? '• مباشر الآن (LIVE)' : item.status === 'finished' ? 'انتهت' : 'مجدولة قريباً'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">{item.tournamentName}</span>
                        {item.channelId && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/25 font-bold flex items-center gap-1">
                            📺 {channels.find(c => c.id === item.channelId)?.name || "بث القناة"}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-150 text-md group-hover:text-blue-400 transition-colors leading-tight">{item.title}</h4>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                        <span>{new Date(item.matchTime).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 p-2.5 sm:p-3 rounded-2xl justify-between sm:justify-start shrink-0">
                      <div className="flex items-center gap-2.5">
                        {/* Home team */}
                        <div className="flex items-center gap-2">
                          {item.teamHomeLogo ? (
                            <img src={item.teamHomeLogo} alt={item.teamHome} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-700/60" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-blue-500/30">H</div>
                          )}
                          <span className="text-xs font-bold text-slate-200 whitespace-nowrap">{item.teamHome}</span>
                        </div>

                        {/* Middle status or score */}
                        <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-yellow-500 shrink-0">
                          {item.status === 'scheduled' ? (
                            <span className="text-blue-400 text-[10px] px-1 font-bold">VS</span>
                          ) : (
                            <span>{item.scoreHome !== undefined ? item.scoreHome : 0} - {item.scoreAway !== undefined ? item.scoreAway : 0}</span>
                          )}
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 whitespace-nowrap">{item.teamAway}</span>
                          {item.teamAwayLogo ? (
                            <img src={item.teamAwayLogo} alt={item.teamAway} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-700/60" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-orange-600/30 text-orange-400 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-orange-500/30">A</div>
                          )}
                        </div>
                      </div>

                      <span className="w-8 h-8 rounded-lg bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:text-white transition cursor-pointer">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION C: MOVIES & SERIES (أفلام ومسلسلات) */}
        {activeTab === "on_demand" && (
          <div id="vod-section-grid" className="space-y-6">
            
            {/* Filter Sub-categories */}
            <div className="flex items-center justify-between border-b border-slate-905 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => { setOnDemandFilter("all"); setSelectedSeries(null); }}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer ${
                    onDemandFilter === "all" && !selectedSeries
                      ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                      : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => { setOnDemandFilter("movies"); setSelectedSeries(null); }}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer ${
                    onDemandFilter === "movies" && !selectedSeries
                      ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                      : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                  }`}
                >
                  الأفلام السينمائية (Movies)
                </button>
                <button
                  onClick={() => { setOnDemandFilter("series"); setSelectedSeries(null); }}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition border cursor-pointer ${
                    onDemandFilter === "series" && !selectedSeries
                      ? "bg-slate-100 border-slate-100 text-slate-950 shadow-md" 
                      : "bg-slate-900 border-slate-800 text-slate-450 hover:text-white"
                  }`}
                >
                  المسلسلات الكاملة (Series)
                </button>
              </div>

              {selectedSeries && (
                <button
                  onClick={() => { setSelectedSeries(null); }}
                  className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة للمعرض الرئيسي</span>
                </button>
              )}
            </div>

            {/* IF A SERIES IS SELECTED: SHOW EPISODES NAVIGATION */}
            {selectedSeries ? (
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={selectedSeries.posterUrl}
                    alt={selectedSeries.title}
                    className="w-40 h-56 rounded-xl object-cover bg-slate-950 border border-slate-800 shadow-md"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60"; }}
                  />
                  <div className="space-y-4 text-right flex-1">
                    <div>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">مسلسل تلفزيوني كامل</span>
                      <h3 className="text-2xl font-black text-slate-150 mt-1">{selectedSeries.title}</h3>
                    </div>
                    
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{selectedSeries.description}</p>
                    
                    {/* Season Choice Tabs */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-semibold text-slate-400">اختر الموسم التلفزيوني:</label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {seasons.filter(s => s.seriesId === selectedSeries.id).length === 0 ? (
                          <div className="text-xs text-slate-500">لم يتم تسجيل مواسم لهذا المسلسل بعد.</div>
                        ) : (
                          seasons.filter(s => s.seriesId === selectedSeries.id).map(s => (
                            <button
                              key={s.id}
                              onClick={() => setSelectedSeasonId(s.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer select-none border ${
                                selectedSeasonId === s.id 
                                  ? "bg-blue-600 border-blue-500 text-white font-black" 
                                  : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                              }`}
                            >
                              {s.title}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Episodes Cards list */}
                <div className="border-t border-slate-850 pt-5 space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-150">قائمة حلقات الموسم المحدد:</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {episodes.filter(e => e.seasonId === selectedSeasonId).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                        لا توجد حلقات مدرجة لهذا الموسم في قاعدة البيانات ومفصلة للمدير حالياً.
                      </div>
                    ) : (
                      episodes
                        .filter(e => e.seasonId === selectedSeasonId)
                        .sort((a,b) => a.episodeNumber - b.episodeNumber)
                        .map(ep => (
                          <div
                            key={ep.id}
                            onClick={() => playEpisodeStream(ep)}
                            className="group bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all active:scale-98"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold font-mono text-sm group-hover:bg-blue-600 group-hover:text-white transition">
                                {ep.episodeNumber}
                              </span>
                              <div>
                                <h5 className="font-extrabold text-xs text-slate-150 group-hover:text-blue-400 truncate max-w-[170px]">{ep.title}</h5>
                                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">انقر للتشغيل في الهاتف</span>
                              </div>
                            </div>
                            <span className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-400/50 transition">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD DISCOVER GALLERY */
              <div className="space-y-6">
                {/* 1. MOVIES (الأفلام) */}
                {(onDemandFilter === "all" || onDemandFilter === "movies") && (
                  <div className="space-y-3">
                    <h4 className="text-md font-bold text-slate-150 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      أحدث الأفلام والسينمائيات
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredMovies.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-500 text-xs">لا يوجد أفلام مطابقة للبحث.</div>
                      ) : (
                        filteredMovies.map(mov => (
                          <div
                            key={mov.id}
                            onClick={() => playMovieStream(mov)}
                            className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 p-2.5 rounded-xl transition duration-300 flex flex-col justify-between cursor-pointer select-none"
                          >
                            <div className="aspect-[3/4] rounded-lg overflow-hidden relative bg-slate-950 border border-slate-850">
                              <img
                                src={mov.posterUrl}
                                alt={mov.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60"; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition">
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                </span>
                              </div>
                            </div>
                            <h5 className="font-extrabold text-xs text-slate-150 group-hover:text-blue-400 mt-2 line-clamp-1 truncate">{mov.title}</h5>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{mov.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SERIES (المسلسلات) */}
                {(onDemandFilter === "all" || onDemandFilter === "series") && (
                  <div className="space-y-3 pt-4">
                    <h4 className="text-md font-bold text-slate-150 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      المسلسلات المتكاملة (قائمة الحلقات)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredSeries.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-500 text-xs">لا يوجد مسلسلات مسجلة.</div>
                      ) : (
                        filteredSeries.map(ser => (
                          <div
                            key={ser.id}
                            onClick={() => setSelectedSeries(ser)}
                            className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 p-2.5 rounded-xl transition duration-300 flex flex-col justify-between cursor-pointer select-none"
                          >
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-950 border border-slate-850 relative">
                              <img
                                src={ser.posterUrl}
                                alt={ser.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60"; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center pb-2">
                                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-md">
                                  عرض الحلقات
                                </span>
                              </div>
                            </div>
                            <h5 className="font-extrabold text-xs text-slate-150 group-hover:text-blue-400 mt-2 line-clamp-1 truncate">{ser.title}</h5>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{ser.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* 5. MATCH DISPLAY SHEET DETAIL MODAL */}
      {selectedMatch && (
        <div id="match-details-sheet" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4">
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                selectedMatch.status === 'live' 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                  : selectedMatch.status === 'finished' 
                  ? 'bg-slate-800 text-slate-400' 
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              }`}>
                {selectedMatch.status === 'live' ? '• بث حي ومباشر الآن' : selectedMatch.status === 'finished' ? 'مباراة منتهية' : 'مباراة مجدولة قريباً'}
              </span>

              <h3 className="text-lg font-black text-slate-150">{selectedMatch.title}</h3>
              <p className="text-xs text-slate-400">{selectedMatch.tournamentName}</p>

              {/* Versing visual panel */}
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex items-center justify-around my-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    {selectedMatch.teamHomeLogo ? (
                      <img src={selectedMatch.teamHomeLogo} alt={selectedMatch.teamHome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-lg font-black text-blue-400 font-mono">{selectedMatch.teamHome.slice(0, 2)}</span>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-200">{selectedMatch.teamHome}</span>
                </div>

                <div className="flex flex-col items-center">
                  {selectedMatch.status === 'scheduled' ? (
                    <span className="text-lg font-black text-blue-400 font-mono italic">VS</span>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-2xl font-black text-yellow-400 font-mono bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-2xl tracking-widest shadow-inner">
                        {selectedMatch.scoreHome !== undefined ? selectedMatch.scoreHome : 0}:{selectedMatch.scoreAway !== undefined ? selectedMatch.scoreAway : 0}
                      </span>
                      {selectedMatch.status === 'live' && (
                        <span className="text-[9px] text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded animate-pulse">الدقيقة الجارية</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    {selectedMatch.teamAwayLogo ? (
                      <img src={selectedMatch.teamAwayLogo} alt={selectedMatch.teamAway} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-lg font-black text-orange-400 font-mono">{selectedMatch.teamAway.slice(0, 2)}</span>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-200">{selectedMatch.teamAway}</span>
                </div>
              </div>

              {/* Broadcast / Channel alignment note */}
              {selectedMatch.channelId && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-xl flex items-center gap-2 justify-center mb-4 font-bold">
                  <span>📺 القناة الناقلة:</span>
                  <span className="text-white bg-blue-600 px-2.5 py-0.5 rounded-lg border border-blue-500">
                    {channels.find(c => c.id === selectedMatch.channelId)?.name || "قناة مدرجة"}
                  </span>
                </div>
              )}

              {/* Timings */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1 text-right text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>تاريخ وموعد اللقاء:</span>
                  <span className="font-bold text-white font-mono">{new Date(selectedMatch.matchTime).toLocaleString('ar-EG')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-900">
                  <span>رابط البث:</span>
                  <span className="text-slate-500 text-[10px] break-all truncate max-w-[200px] font-mono">{selectedMatch.streamUrl}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => playMatchStream(selectedMatch)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  تشغيل البث المباشر الموفر
                </button>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADMIN SYSTEM MODAL DOCK */}
      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onRefreshAll={refreshAllData}
        />
      )}

      {/* 7. Footer Credits information */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 pb-12 pt-6 px-4 text-center text-slate-500 text-xs">
        <p className="font-sans font-bold text-slate-400">© 2026 جميع الحقوق محفوظة لدى Staad TV</p>
        <p className="mt-1 font-sans text-slate-500">تطوير وبرمجة مفيد الزري</p>
      </footer>
    </div>
  );
}
