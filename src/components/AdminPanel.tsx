import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  Lock, 
  Check, 
  Tv, 
  Activity, 
  Film, 
  Layers, 
  X, 
  FolderPlus,
  RefreshCw,
  UploadCloud,
  FileText,
  AlertCircle,
  Copy,
  Download,
  CheckSquare,
  Square
} from "lucide-react";
import { 
  Channel, 
  LiveMatch, 
  Movie, 
  Series, 
  Season, 
  Episode,
  ChannelCategory,
  MatchStatus
} from "../types";
import { 
  fetchChannels, saveChannel, removeChannel,
  fetchMatches, saveMatch, removeMatch,
  fetchMovies, saveMovie, removeMovie,
  fetchSeries, saveSeries, removeSeries,
  fetchSeasons, saveSeason, removeSeason,
  fetchEpisodes, saveEpisode, removeEpisode
} from "../db";
import { isFirebaseConfigured } from "../firebase";

interface AdminPanelProps {
  onClose: () => void;
  onRefreshAll: () => void;
}

export default function AdminPanel({ onClose, onRefreshAll }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // DB States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Selected Section
  type Tab = "channels" | "matches" | "movies" | "series" | "episodes";
  const [activeTab, setActiveTab] = useState<Tab>("channels");

  // Loading indicator
  const [loading, setLoading] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form bindings
  // Channel form
  const [chnName, setChnName] = useState("");
  const [chnLogo, setChnLogo] = useState("");
  const [chnStream, setChnStream] = useState("");
  const [chnCategory, setChnCategory] = useState<ChannelCategory>(ChannelCategory.SPORTS);

  // Match form
  const [matchTitle, setMatchTitle] = useState("");
  const [matchTeamHome, setMatchTeamHome] = useState("");
  const [matchTeamAway, setMatchTeamAway] = useState("");
  const [matchTeamHomeLogo, setMatchTeamHomeLogo] = useState("");
  const [matchTeamAwayLogo, setMatchTeamAwayLogo] = useState("");
  const [matchTour, setMatchTour] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchStream, setMatchStream] = useState("");
  const [matchStatus, setMatchStatus] = useState<MatchStatus>(MatchStatus.SCHEDULED);
  const [matchChannelId, setMatchChannelId] = useState("");
  const [matchScoreHome, setMatchScoreHome] = useState<number | "">("");
  const [matchScoreAway, setMatchScoreAway] = useState<number | "">("");

  // Movie form
  const [movieTitle, setMovieTitle] = useState("");
  const [moviePoster, setMoviePoster] = useState("");
  const [movieDesc, setMovieDesc] = useState("");
  const [movieStream, setMovieStream] = useState("");

  // Series form
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesPoster, setSeriesPoster] = useState("");
  const [seriesDesc, setSeriesDesc] = useState("");

  // Episodes & Seasons forms
  const [epTitle, setEpTitle] = useState("");
  const [epNum, setEpNum] = useState(1);
  const [epStream, setEpStream] = useState("");
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonNum, setNewSeasonNum] = useState(1);

  // Multi-Select & Export States
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([]);
  const [exportedM3uText, setExportedM3uText] = useState("");
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  useEffect(() => {
    setSelectedChannelIds([]);
    setSelectedMovieIds([]);
    setSelectedSeriesIds([]);
  }, [activeTab]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportChannelsToM3U = () => {
    const listToExport = channels.filter(c => selectedChannelIds.includes(c.id));
    const finalExportList = listToExport.length > 0 ? listToExport : channels;
    
    let m3uContent = "#EXTM3U\n";
    finalExportList.forEach(chan => {
      const categoryLabel = chan.category === "sports" ? "sports" : chan.category === "news" ? "news" : "general";
      m3uContent += `#EXTINF:-1 tvg-logo="${chan.logoUrl || ''}" group-title="${categoryLabel}",${chan.name}\n${chan.streamUrl}\n`;
    });

    setExportedM3uText(m3uContent);
  };

  const exportMoviesToM3U = () => {
    const listToExport = movies.filter(m => selectedMovieIds.includes(m.id));
    const finalExportList = listToExport.length > 0 ? listToExport : movies;
    
    let m3uContent = "#EXTM3U\n";
    finalExportList.forEach(movie => {
      m3uContent += `#EXTINF:-1 tvg-logo="${movie.posterUrl || ''}" group-title="Movies",${movie.title}\n${movie.videoUrl}\n`;
    });

    setExportedM3uText(m3uContent);
  };

  const exportSeriesToM3U = () => {
    const selectedSeriesList = series.filter(s => selectedSeriesIds.includes(s.id));
    const finalSeriesList = selectedSeriesList.length > 0 ? selectedSeriesList : series;
    
    let m3uContent = "#EXTM3U\n";
    finalSeriesList.forEach(s => {
      const seriesEpisodes = episodes.filter(ep => ep.seriesId === s.id);
      seriesEpisodes.forEach(ep => {
        const season = seasons.find(sea => sea.id === ep.seasonId);
        const titleFull = `${s.title} - ${season ? `${season.title} - ` : ''}الحلقة ${ep.episodeNumber}: ${ep.title}`;
        m3uContent += `#EXTINF:-1 tvg-logo="${s.posterUrl || ''}" group-title="Series - ${s.title}",${titleFull}\n${ep.videoUrl}\n`;
      });
    });

    setExportedM3uText(m3uContent);
  };

  const handleBulkDeleteChannels = async () => {
    if (selectedChannelIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedChannelIds.length} من القنوات المحددة دفعة واحدة؟`)) return;
    setLoading(true);
    try {
      for (const id of selectedChannelIds) {
        await removeChannel(id);
      }
      setSelectedChannelIds([]);
      await reloadAllData();
      onRefreshAll();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteMovies = async () => {
    if (selectedMovieIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedMovieIds.length} من الأفلام المحددة دفعة واحدة؟`)) return;
    setLoading(true);
    try {
      for (const id of selectedMovieIds) {
        await removeMovie(id);
      }
      setSelectedMovieIds([]);
      await reloadAllData();
      onRefreshAll();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteSeries = async () => {
    if (selectedSeriesIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedSeriesIds.length} من المسلسلات المحددة بجميع مواسمها وحلقاتها دفعة واحدة؟`)) return;
    setLoading(true);
    try {
      for (const id of selectedSeriesIds) {
        await removeSeries(id);
      }
      setSelectedSeriesIds([]);
      await reloadAllData();
      onRefreshAll();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // M3U Import States
  const [m3uText, setM3uText] = useState("");
  const [m3uDragActive, setM3uDragActive] = useState(false);
  const [parsedM3UChannels, setParsedM3UChannels] = useState<Channel[]>([]);
  const [replaceExistingChannels, setReplaceExistingChannels] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: number; error?: string } | null>(null);

  // M3U Parsing function
  const parseM3UText = (text: string) => {
    try {
      const lines = text.split(/\r?\n/);
      const tempChannels: Channel[] = [];
      let currentInfo: { name: string; logoUrl: string; category: ChannelCategory } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("#EXTINF:")) {
          let name = "قناة مجهولة";
          let logoUrl = "";
          let category = ChannelCategory.GENERAL;

          // Parse tvg-logo
          const logoMatch = line.match(/tvg-logo="([^"]+)"/) || line.match(/logo="([^"]+)"/);
          if (logoMatch) logoUrl = logoMatch[1];

          // Parse category
          const groupMatch = line.match(/group-title="([^"]+)"/);
          if (groupMatch) {
            const group = groupMatch[1].toLowerCase();
            if (group.includes("sport") || group.includes("رياض") || group.includes("bein") || group.includes("alkass") || group.includes("ssc") || group.includes("koora")) {
              category = ChannelCategory.SPORTS;
            } else if (group.includes("news") || group.includes("إخبار") || group.includes("اخبار") || group.includes("حدث") || group.includes("جزيرة") || group.includes("عربية")) {
              category = ChannelCategory.NEWS;
            }
          }

          // Parse name from after comma
          const commaIndex = line.lastIndexOf(",");
          if (commaIndex !== -1) {
            const namePart = line.substring(commaIndex + 1).trim();
            if (namePart) name = namePart;
          } else {
            const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);
            if (tvgNameMatch) name = tvgNameMatch[1];
          }

          // Fallback heuristic check of the name
          const lowerName = name.toLowerCase();
          if (lowerName.includes("sport") || lowerName.includes("سبورت") || lowerName.includes("كأس") || lowerName.includes("ssc") || lowerName.includes("أبوظبي الرياضية")) {
            category = ChannelCategory.SPORTS;
          } else if (lowerName.includes("news") || lowerName.includes("أخبار") || lowerName.includes("اخبار") || lowerName.includes("حدث") || lowerName.includes("جزيرة") || lowerName.includes("عربية")) {
            category = ChannelCategory.NEWS;
          }

          currentInfo = { name, logoUrl, category };
        } else if (line.startsWith("#")) {
          // Ignore comment
        } else {
          // Stream URL
          if (line.startsWith("http://") || line.startsWith("https://")) {
            tempChannels.push({
              id: "channel_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
              name: currentInfo?.name || `بث مباشر ${tempChannels.length + 1}`,
              logoUrl: currentInfo?.logoUrl || "https://images.unsplash.com/photo-1540747737956-378724044453?w=150&auto=format&fit=crop&q=60",
              streamUrl: line,
              category: currentInfo?.category || ChannelCategory.GENERAL
            });
            currentInfo = null; // Clear info
          }
        }
      }

      setParsedM3UChannels(tempChannels);
      if (tempChannels.length === 0) {
        setImportStatus({ error: "لم يتم العثور على أي قنوات بث صالحة في النص المدخل!" });
      } else {
        setImportStatus(null);
      }
    } catch (err: any) {
      setImportStatus({ error: "فشل تحليل المحتوى: " + err.message });
    }
  };

  const handleM3UFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readM3UFile(file);
  };

  const handleM3UDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setM3uDragActive(true);
  };

  const handleM3UDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setM3uDragActive(false);
  };

  const handleM3UDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setM3uDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readM3UFile(file);
    }
  };

  const readM3UFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setM3uText(text);
      parseM3UText(text);
    };
    reader.onerror = () => {
      setImportStatus({ error: "حدث خطأ أثناء قراءة الملف المحدد." });
    };
    reader.readAsText(file);
  };

  const handleImportSave = async () => {
    if (parsedM3UChannels.length === 0) return;
    setLoading(true);
    setImportStatus(null);

    try {
      // 1. If replace is checked, delete all existing channels
      if (replaceExistingChannels) {
        for (const ch of channels) {
          await removeChannel(ch.id);
        }
      }

      // 2. Save each newly parsed channel
      for (const ch of parsedM3UChannels) {
        await saveChannel(ch);
      }

      setImportStatus({ success: parsedM3UChannels.length });
      setParsedM3UChannels([]);
      setM3uText("");
      
      // 3. Reload data
      await reloadAllData();
      onRefreshAll();
    } catch (err: any) {
      setImportStatus({ error: "حدث خطأ أثناء حفظ القنوات: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all databases
  const reloadAllData = async () => {
    setLoading(true);
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

      if (fs.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(fs[0].id);
      }
    } catch (e) {
      console.error("Error loading admin databases:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      reloadAllData();
    }
  }, [isAuthenticated]);

  // Handle selected series/season changes
  useEffect(() => {
    const seriesSeasons = seasons.filter(s => s.seriesId === selectedSeriesId);
    if (seriesSeasons.length > 0) {
      setSelectedSeasonId(seriesSeasons[0].id);
    } else {
      setSelectedSeasonId("");
    }
  }, [selectedSeriesId, seasons]);

  // Simple hardcoded fallback passcode gate as fallback
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "!4GC%f'B=%'nRvR") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("رمز المرور غير صحيح! حاول مرة أخرى.");
    }
  };

  // --- CRUD FUNCTIONS ---

  // Channel Form Reset & Submit
  const resetChannelForm = () => {
    setEditingId(null);
    setChnName("");
    setChnLogo("");
    setChnStream("");
    setChnCategory(ChannelCategory.SPORTS);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chnName || !chnStream) return;

    const channelItem: Channel = {
      id: editingId || "channel_" + Date.now(),
      name: chnName,
      logoUrl: chnLogo || "https://images.unsplash.com/photo-1540747737956-378724044453?w=150&auto=format&fit=crop&q=60",
      streamUrl: chnStream,
      category: chnCategory
    };

    setLoading(true);
    await saveChannel(channelItem);
    resetChannelForm();
    await reloadAllData();
    onRefreshAll();
  };

  const startEditChannel = (item: Channel) => {
    setEditingId(item.id);
    setChnName(item.name);
    setChnLogo(item.logoUrl);
    setChnStream(item.streamUrl);
    setChnCategory(item.category);
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القناة؟")) return;
    setLoading(true);
    await removeChannel(id);
    await reloadAllData();
    onRefreshAll();
  };

  // Match Form Reset & Submit
  const resetMatchForm = () => {
    setEditingId(null);
    setMatchTitle("");
    setMatchTeamHome("");
    setMatchTeamAway("");
    setMatchTeamHomeLogo("");
    setMatchTeamAwayLogo("");
    setMatchTour("");
    setMatchTime(new Date().toISOString().slice(0, 16));
    setMatchStream("");
    setMatchStatus(MatchStatus.SCHEDULED);
    setMatchChannelId("");
    setMatchScoreHome("");
    setMatchScoreAway("");
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTitle || !matchStream || !matchTeamHome || !matchTeamAway) return;

    const matchItem: LiveMatch = {
      id: editingId || "match_" + Date.now(),
      title: matchTitle,
      teamHome: matchTeamHome,
      teamAway: matchTeamAway,
      teamHomeLogo: matchTeamHomeLogo || undefined,
      teamAwayLogo: matchTeamAwayLogo || undefined,
      tournamentName: matchTour || "بطولة عامة",
      matchTime: new Date(matchTime).toISOString(),
      streamUrl: matchStream,
      status: matchStatus,
      channelId: matchChannelId || undefined,
      scoreHome: matchScoreHome !== "" ? Number(matchScoreHome) : undefined,
      scoreAway: matchScoreAway !== "" ? Number(matchScoreAway) : undefined
    };

    setLoading(true);
    await saveMatch(matchItem);
    resetMatchForm();
    await reloadAllData();
    onRefreshAll();
  };

  const startEditMatch = (item: LiveMatch) => {
    setEditingId(item.id);
    setMatchTitle(item.title);
    setMatchTeamHome(item.teamHome);
    setMatchTeamAway(item.teamAway);
    setMatchTeamHomeLogo(item.teamHomeLogo || "");
    setMatchTeamAwayLogo(item.teamAwayLogo || "");
    setMatchTour(item.tournamentName);
    setMatchTime(new Date(item.matchTime).toISOString().slice(0, 16));
    setMatchStream(item.streamUrl);
    setMatchStatus(item.status);
    setMatchChannelId(item.channelId || "");
    setMatchScoreHome(item.scoreHome !== undefined && item.scoreHome !== null ? item.scoreHome : "");
    setMatchScoreAway(item.scoreAway !== undefined && item.scoreAway !== null ? item.scoreAway : "");
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المباراة؟")) return;
    setLoading(true);
    await removeMatch(id);
    await reloadAllData();
    onRefreshAll();
  };

  // Movie Form Reset & Submit
  const resetMovieForm = () => {
    setEditingId(null);
    setMovieTitle("");
    setMoviePoster("");
    setMovieDesc("");
    setMovieStream("");
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle || !movieStream) return;

    const movieItem: Movie = {
      id: editingId || "movie_" + Date.now(),
      title: movieTitle,
      posterUrl: moviePoster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60",
      description: movieDesc || "فيلم مشوق ومليء بالإثارة.",
      videoUrl: movieStream
    };

    setLoading(true);
    await saveMovie(movieItem);
    resetMovieForm();
    await reloadAllData();
    onRefreshAll();
  };

  const startEditMovie = (item: Movie) => {
    setEditingId(item.id);
    setMovieTitle(item.title);
    setMoviePoster(item.posterUrl);
    setMovieDesc(item.description);
    setMovieStream(item.videoUrl);
  };

  const handleDeleteMovie = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيلم؟")) return;
    setLoading(true);
    await removeMovie(id);
    await reloadAllData();
    onRefreshAll();
  };

  // Series Form Reset & Submit
  const resetSeriesForm = () => {
    setEditingId(null);
    setSeriesTitle("");
    setSeriesPoster("");
    setSeriesDesc("");
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle) return;

    const seriesItem: Series = {
      id: editingId || "series_" + Date.now(),
      title: seriesTitle,
      posterUrl: seriesPoster || "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60",
      description: seriesDesc || "مسلسل مشوق يعرض قصة فريدة."
    };

    setLoading(true);
    await saveSeries(seriesItem);
    resetSeriesForm();
    await reloadAllData();
    onRefreshAll();
  };

  const startEditSeries = (item: Series) => {
    setEditingId(item.id);
    setSeriesTitle(item.title);
    setSeriesPoster(item.posterUrl);
    setSeriesDesc(item.description);
  };

  const handleDeleteSeries = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المسلسل بجميع أجزائه وحلقاته؟")) return;
    setLoading(true);
    await removeSeries(id);
    await reloadAllData();
    onRefreshAll();
  };

  // Episode & Season add / remove
  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId || !newSeasonTitle) return;

    const seasonItem: Season = {
      id: "season_" + Date.now(),
      seriesId: selectedSeriesId,
      seasonNumber: newSeasonNum || 1,
      title: newSeasonTitle
    };

    setLoading(true);
    await saveSeason(seasonItem);
    setNewSeasonTitle("");
    setNewSeasonNum(prev => prev + 1);
    await reloadAllData();
    onRefreshAll();
  };

  const handleDeleteSeason = async (id: string) => {
    if (!confirm("عند حذف هذا الموسم سيتم حذف جميع الحلقات التابعة له تلقائياً. هل أنت متأكد؟")) return;
    setLoading(true);
    await removeSeason(id);
    await reloadAllData();
    onRefreshAll();
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId || !selectedSeasonId || !epTitle || !epStream) return;

    const episodeItem: Episode = {
      id: editingId || "episode_" + Date.now(),
      seriesId: selectedSeriesId,
      seasonId: selectedSeasonId,
      episodeNumber: epNum || 1,
      title: epTitle,
      videoUrl: epStream
    };

    setLoading(true);
    await saveEpisode(episodeItem);
    setEditingId(null);
    setEpTitle("");
    setEpStream("");
    setEpNum(prev => prev + 1);
    await reloadAllData();
    onRefreshAll();
  };

  const startEditEpisode = (item: Episode) => {
    setEditingId(item.id);
    setSelectedSeriesId(item.seriesId);
    setSelectedSeasonId(item.seasonId);
    setEpNum(item.episodeNumber);
    setEpTitle(item.title);
    setEpStream(item.videoUrl);
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحلقة؟")) return;
    setLoading(true);
    await removeEpisode(id);
    await reloadAllData();
    onRefreshAll();
  };

  // Form gating screen if not authorized
  if (!isAuthenticated) {
    return (
      <div id="admin-passcode-modal" className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">لوحة تحكم المدير الآمنة</h3>
            <p className="text-slate-400 text-sm">
              الرجاء إدخال رمز المرور السري للمدير للوصول إلى لوحة تحديث القنوات والمباريات الحية.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">رمز المرور للمشرف</label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="أدخل رمز المرور هنا..."
                className="w-full px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center tracking-widest font-mono"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs text-center font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer"
            >
              تسجيل الدخول الآمن
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] text-slate-500 font-mono">
            * تم تحديث رمز المرور الآمن إلى الرمز الجديد المطلوب.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-full" className="fixed inset-0 bg-slate-950 flex flex-col z-50 font-sans text-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-slate-910 border-b border-slate-905 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl shrink-0">
            <Activity className="w-5 h-5 sm:w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-extrabold text-white flex flex-wrap items-center gap-1.5 sm:gap-2 leading-tight">
              <span>لوحة تحكم تطبيق Staad TV</span>
              <span className="text-[9px] sm:text-[10px] bg-slate-850 px-2 py-0.5 rounded-full border border-slate-700/60 font-mono text-slate-400 shrink-0">
                {isFirebaseConfigured ? "متصل بقاعدة Firebase" : "وضع التخزين المحلي"}
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">يمكنك هنا إضافة، تعديل وحذف كافة المحتويات بشكل ديناميكي</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start shrink-0">
          <button 
            onClick={reloadAllData}
            title="تحديث البيانات"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer text-xs sm:text-sm font-bold"
          >
            إغلاق اللوحة
          </button>
        </div>
      </header>

      {/* Main Layout split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-l border-slate-900 p-2.5 md:p-4 space-y-0 md:space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 scrollbar-none gap-1.5 md:gap-0">
          <div className="hidden md:block text-xs uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">الأقسام الرئيسية</div>
          <button
            onClick={() => { setActiveTab("channels"); resetChannelForm(); }}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition font-medium text-xs md:text-sm cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "channels" ? "bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Tv className="w-3.5 h-3.5 md:w-4 h-4" />
            <span>إدارة القنوات</span>
          </button>
          <button
            onClick={() => { setActiveTab("matches"); resetMatchForm(); }}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition font-medium text-xs md:text-sm cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "matches" ? "bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 md:w-4 h-4" />
            <span>المباريات المباشرة</span>
          </button>
          <button
            onClick={() => { setActiveTab("movies"); resetMovieForm(); }}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition font-medium text-xs md:text-sm cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "movies" ? "bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Film className="w-3.5 h-3.5 md:w-4 h-4" />
            <span>إدارة الأفلام</span>
          </button>
          <button
            onClick={() => { setActiveTab("series"); resetSeriesForm(); }}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition font-medium text-xs md:text-sm cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "series" ? "bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 md:w-4 h-4" />
            <span>إدارة المسلسلات</span>
          </button>
          <button
            onClick={() => { setActiveTab("episodes"); setEditingId(null); }}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition font-medium text-xs md:text-sm cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "episodes" ? "bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 md:w-4 h-4" />
            <span>الحلقات والمواسم</span>
          </button>

          <div className="hidden md:block mt-auto p-4 bg-slate-900/60 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>ملاحظة أمنية</span>
            </div>
            <span>لقد تم تأمين لوحة الإدارة من خلال تشفير المصادقة وهيكل الحماية للمطابقة.</span>
          </div>
        </nav>

        {/* Dynamic Grid Action Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/40">
          {loading && (
            <div className="p-4 mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm rounded-xl flex items-center gap-3 justify-center animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري حفظ وتحميل البيانات بقاعدة البيانات...</span>
            </div>
          )}

          {/* TAB 1: CHANNELS */}
          {activeTab === "channels" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form and M3U Import */}
              <div className="space-y-6">
                {/* Form Add/Edit */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 h-fit space-y-4 text-right">
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2 justify-start">
                    <Tv className="w-4 h-4 text-blue-400" />
                    <span>{editingId ? "تعديل بيانات القناة" : "إضافة قناة جديدة"}</span>
                  </h3>

                  <form onSubmit={handleSaveChannel} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">اسم القناة *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: بي إن سبورتس 1"
                        value={chnName}
                        onChange={(e) => setChnName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">رابط الشعار (صورة)</label>
                      <input
                        type="url"
                        placeholder="رابط الصورة المباشر..."
                        value={chnLogo}
                        onChange={(e) => setChnLogo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">رابط البث المباشر (HLS .m3u8) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Http://domain.com/live/index.m3u8"
                        value={chnStream}
                        onChange={(e) => setChnStream(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">الفئة الفرعية</label>
                      <select
                        value={chnCategory}
                        onChange={(e) => setChnCategory(e.target.value as ChannelCategory)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      >
                        <option value={ChannelCategory.SPORTS}>رياضية (Sports)</option>
                        <option value={ChannelCategory.NEWS}>إخبارية (News)</option>
                        <option value={ChannelCategory.GENERAL}>عامة (General)</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                      >
                        {editingId ? "حفظ التعديلات" : "إضافة لقائمة القنوات"}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetChannelForm}
                          className="py-2 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition cursor-pointer"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Section: Import channels via M3U/M3U8 */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 h-fit space-y-4 text-right">
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2 justify-start">
                    <FolderPlus className="w-4 h-4 text-emerald-400" />
                    <span>استيراد قنوات دفعة واحدة (M3U/M3U8)</span>
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    قم بلصق كود قائمة التشغيل M3U/M3U8 أو اسحب ملف القنوات لتسجيل القنوات تلقائياً في ثوانٍ.
                  </p>

                  {/* Drag and Drop area */}
                  <div
                    onDragOver={handleM3UDragOver}
                    onDragLeave={handleM3UDragLeave}
                    onDrop={handleM3UDrop}
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-305 ${
                      m3uDragActive 
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 scale-[1.02]" 
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/50 text-slate-400"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".m3u,.m3u8,.txt"
                      onChange={handleM3UFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UploadCloud className="w-8 h-8 text-slate-500" />
                      <div className="text-xs font-bold text-slate-350">
                        اسحب ملف M3U هنا، أو <span className="text-blue-400 underline">اختر ملفاً</span>
                      </div>
                      <span className="text-[10px] text-slate-500">يدعم صيغ .m3u و .m3u8 و .txt</span>
                    </div>
                  </div>

                  {/* Textarea for raw paste */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-450 mb-1">أو الصق النص هنا:</label>
                    <textarea
                      rows={5}
                      value={m3uText}
                      onChange={(e) => {
                        setM3uText(e.target.value);
                        parseM3UText(e.target.value);
                      }}
                      placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="Sports",اسم القناة\nhttp://server.com/stream.m3u8`}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
                      dir="ltr"
                    />
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 text-xs text-slate-300 rounded-lg border border-slate-850">
                    <input
                      id="replace-channels-opt"
                      type="checkbox"
                      checked={replaceExistingChannels}
                      onChange={(e) => setReplaceExistingChannels(e.target.checked)}
                      className="w-4 h-4 text-blue-605 bg-slate-950 border-slate-850 rounded focus:ring-blue-500 focus:ring-opacity-25"
                    />
                    <label htmlFor="replace-channels-opt" className="cursor-pointer select-none font-bold">
                      حذف جميع القنوات الحالية قبل استيراد القائمة الجديدة
                    </label>
                  </div>

                  {/* Preview detected channels */}
                  {parsedM3UChannels.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>تم اكتشاف {parsedM3UChannels.length} قناة جاهزة</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setParsedM3UChannels([]);
                            setM3uText("");
                          }}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          إلغاء المعاينة
                        </button>
                      </div>

                      <div className="max-h-24 overflow-y-auto space-y-1 pl-1 scrollbar-thin">
                        {parsedM3UChannels.slice(0, 5).map((ch, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-950/80 p-1.5 rounded border border-slate-850/80 text-right">
                            <span className="font-extrabold truncate max-w-[120px]">{ch.name}</span>
                            <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-850 px-1 py-0.2 rounded font-mono">
                              {ch.category === "sports" ? "رياضية" : ch.category === "news" ? "إخبارية" : "عامة"}
                            </span>
                          </div>
                        ))}
                        {parsedM3UChannels.length > 5 && (
                          <div className="text-[9px] text-slate-500 text-center font-bold pt-1">
                            + {parsedM3UChannels.length - 5} قنوات أخرى...
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleImportSave}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-black rounded-lg transition shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>حفظ وإضافة {parsedM3UChannels.length} قناة للقاعدة</span>
                      </button>
                    </div>
                  )}

                  {/* Feedback Status messages */}
                  {importStatus && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      importStatus.error 
                        ? "bg-red-500/10 border-red-500/20 text-red-400" 
                        : "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                    }`}>
                      {importStatus.error ? (
                        <>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{importStatus.error}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 shrink-0 bg-emerald-500/25 rounded-full p-0.5" />
                          <span>تم استيراد {importStatus.success} قناة بنجاح!</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-blue-500" />
                    <span>القنوات الحالية ({channels.length})</span>
                    {selectedChannelIds.length > 0 && (
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold font-mono">
                        تم تحديد {selectedChannelIds.length}
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedChannelIds.length === channels.length) {
                          setSelectedChannelIds([]);
                        } else {
                          setSelectedChannelIds(channels.map(c => c.id));
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>{selectedChannelIds.length === channels.length ? "إلغاء التحديد" : "تحديد الكل"}</span>
                    </button>

                    {selectedChannelIds.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={exportChannelsToM3U}
                          className="px-2.5 py-1.5 bg-blue-605 hover:bg-blue-700 text-xs text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold shadow-lg shadow-blue-550/15"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير ({selectedChannelIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDeleteChannels}
                          className="px-2.5 py-1.5 bg-red-650 hover:bg-red-700 text-xs text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold hover:shadow-red-500/10 shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف ({selectedChannelIds.length})</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={exportChannelsToM3U}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-350 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير كل القنوات</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {channels.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      selectedChannelIds.includes(item.id) 
                        ? 'bg-blue-600/15 border-blue-500/40 shadow shadow-blue-500/5' 
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedChannelIds.includes(item.id)) {
                              setSelectedChannelIds(selectedChannelIds.filter(id => id !== item.id));
                            } else {
                              setSelectedChannelIds([...selectedChannelIds, item.id]);
                            }
                          }}
                          className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                            selectedChannelIds.includes(item.id) ? 'text-blue-400' : 'text-slate-650 hover:text-slate-400'
                          }`}
                        >
                          {selectedChannelIds.includes(item.id) ? (
                            <CheckSquare className="w-4.5 h-4.5" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>

                        <img 
                          src={item.logoUrl} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1540747737956-378724044453?w=150&auto=format&fit=crop&q=60"; }}
                          referrerPolicy="no-referrer"
                        />
                        <div 
                          className="min-w-0 flex-1 cursor-pointer select-none"
                          onClick={() => {
                            if (selectedChannelIds.includes(item.id)) {
                              setSelectedChannelIds(selectedChannelIds.filter(id => id !== item.id));
                            } else {
                              setSelectedChannelIds([...selectedChannelIds, item.id]);
                            }
                          }}
                        >
                          <h4 className="font-bold text-sm text-white truncate hover:text-blue-400 transition">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.2 rounded border border-blue-500/20 shrink-0 font-bold">
                              {item.category === "sports" ? "رياضية" : item.category === "news" ? "إخبارية" : "عامة"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] sm:max-w-xs">{item.streamUrl}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditChannel(item)}
                          className="p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-900 rounded-lg transition"
                          title="تعديل القناة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChannel(item.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                          title="حذف القناة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MATCHES */}
          {activeTab === "matches" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Add/Edit */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 h-fit space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  {editingId ? "تعديل تفاصيل المباراة" : "إضافة مباراة مباشر جديدة"}
                </h3>

                <form onSubmit={handleSaveMatch} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">عنوان المباراة الرئيسي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: ريال مدريد ضد برشلونة"
                      value={matchTitle}
                      onChange={(e) => setMatchTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">الفريق الأرضي (Home) *</label>
                      <input
                        type="text"
                        required
                        placeholder="ريال مدريد"
                        value={matchTeamHome}
                        onChange={(e) => setMatchTeamHome(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">الفريق الضيف (Away) *</label>
                      <input
                        type="text"
                        required
                        placeholder="برشلونة"
                        value={matchTeamAway}
                        onChange={(e) => setMatchTeamAway(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">شعار الفريق الأرضي (رابط صورة)</label>
                      <input
                        type="text"
                        placeholder="مثال: https://..."
                        value={matchTeamHomeLogo}
                        onChange={(e) => setMatchTeamHomeLogo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-slate-300 placeholder:text-slate-600 text-xs text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">شعار الفريق الضيف (رابط صورة)</label>
                      <input
                        type="text"
                        placeholder="مثال: https://..."
                        value={matchTeamAwayLogo}
                        onChange={(e) => setMatchTeamAwayLogo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-slate-300 placeholder:text-slate-600 text-xs text-left font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">أهداف الفريق الأرضي</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={matchScoreHome}
                        onChange={(e) => setMatchScoreHome(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">أهداف الفريق الضيف</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={matchScoreAway}
                        onChange={(e) => setMatchScoreAway(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">القناة الناقلة المرتبطة (اختياري)</label>
                    <select
                      value={matchChannelId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMatchChannelId(val);
                        if (val) {
                          const linked = channels.find(c => c.id === val);
                          if (linked && !matchStream) {
                            setMatchStream(linked.streamUrl);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    >
                      <option value="">-- بدون ربط بقناة --</option>
                      {channels.map((chan) => (
                        <option key={chan.id} value={chan.id}>
                          {chan.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">اسم البطولة أو الدوري *</label>
                    <input
                      type="text"
                      required
                      placeholder="الدوري الإسباني"
                      value={matchTour}
                      onChange={(e) => setMatchTour(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">وقت وتاريخ المباراة *</label>
                    <input
                      type="datetime-local"
                      required
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">رابط بث المباراة (HLS .m3u8) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Http://..."
                      value={matchStream}
                      onChange={(e) => setMatchStream(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">الحالية الحالية</label>
                    <select
                      value={matchStatus}
                      onChange={(e) => setMatchStatus(e.target.value as MatchStatus)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    >
                      <option value={MatchStatus.SCHEDULED}>مجدولة (Scheduled)</option>
                      <option value={MatchStatus.LIVE}>مباشر الآن (LIVE)</option>
                      <option value={MatchStatus.FINISHED}>انتهت (Finished)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {editingId ? "حفظ التعديلات" : "إضافة المباراة"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetMatchForm}
                        className="py-2 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">المباريات المسجلة الحالية ({matches.length})</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {matches.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'live' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' 
                              : item.status === 'finished' 
                              ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.status === 'live' ? '• مباشر الآن' : item.status === 'finished' ? 'انتهت' : 'قريباً'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{item.tournamentName}</span>
                          {item.channelId && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/25 font-bold">
                              📺 {channels.find(c => c.id === item.channelId)?.name || "قناة مخصصة"}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-800">
                            {item.teamHomeLogo ? (
                              <img src={item.teamHomeLogo} alt={item.teamHome} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-700" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-blue-500/30">H</div>
                            )}
                            <span className="font-extrabold text-white text-xs sm:text-sm">{item.teamHome}</span>
                          </div>

                          <div className="px-3 py-1 bg-blue-600/20 text-yellow-400 border border-blue-500/40 rounded-lg text-xs font-mono font-bold">
                            {item.scoreHome !== undefined ? item.scoreHome : 0} : {item.scoreAway !== undefined ? item.scoreAway : 0}
                          </div>

                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-800">
                            <span className="font-extrabold text-white text-xs sm:text-sm">{item.teamAway}</span>
                            {item.teamAwayLogo ? (
                              <img src={item.teamAwayLogo} alt={item.teamAway} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-700" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-orange-500/30">A</div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-2 font-medium">توقيت: {new Date(item.matchTime).toLocaleString('ar-EG')}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-1 break-all max-w-[400px]">{item.streamUrl}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditMatch(item)}
                          className="p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-900 rounded-lg transition"
                          title="تعديل بيانات المباراة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(item.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                          title="حذف المباراة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOVIES */}
          {activeTab === "movies" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Add/Edit */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 h-fit space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  {editingId ? "تعديل بيانات الفيلم" : "إضافة فيلم سينمائي جديد"}
                </h3>

                <form onSubmit={handleSaveMovie} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">اسم الفيلم *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: فجر الحارس"
                      value={movieTitle}
                      onChange={(e) => setMovieTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">رابط بوستر الفيلم (صورة عمودية)</label>
                    <input
                      type="url"
                      placeholder="رابط الصورة المباشر..."
                      value={moviePoster}
                      onChange={(e) => setMoviePoster(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">رابط ملف الفيديو (HLS .m3u8 or MP4) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Http://..."
                      value={movieStream}
                      onChange={(e) => setMovieStream(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">وصف الفيلم</label>
                    <textarea
                      placeholder="اكتب نبذة عن القصة أو أبطال الفيلم..."
                      value={movieDesc}
                      onChange={(e) => setMovieDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {editingId ? "حفظ التعديلات" : "إضافة الفيلم"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetMovieForm}
                        className="py-2 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-500" />
                    <span>أفلام الترفيه الحالية ({movies.length})</span>
                    {selectedMovieIds.length > 0 && (
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold font-mono">
                        تم تحديد {selectedMovieIds.length}
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMovieIds.length === movies.length) {
                          setSelectedMovieIds([]);
                        } else {
                          setSelectedMovieIds(movies.map(m => m.id));
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>{selectedMovieIds.length === movies.length ? "إلغاء التحديد" : "تحديد الكل"}</span>
                    </button>

                    {selectedMovieIds.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={exportMoviesToM3U}
                          className="px-2.5 py-1.5 bg-blue-605 hover:bg-blue-700 text-xs text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold shadow-lg shadow-blue-550/15"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير ({selectedMovieIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDeleteMovies}
                          className="px-2.5 py-1.5 bg-red-650 hover:bg-red-700 text-xs text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold hover:shadow-red-500/10 shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف ({selectedMovieIds.length})</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={exportMoviesToM3U}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-350 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير كل الأفلام</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                  {movies.map((item) => (
                    <div key={item.id} className={`p-3 rounded-xl border flex gap-3 justify-between items-start transition ${
                      selectedMovieIds.includes(item.id)
                        ? 'bg-purple-600/10 border-purple-500/45 shadow shadow-purple-500/5'
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                    }`}>
                      <div className="flex gap-3 min-w-0 flex-1">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMovieIds.includes(item.id)) {
                              setSelectedMovieIds(selectedMovieIds.filter(id => id !== item.id));
                            } else {
                              setSelectedMovieIds([...selectedMovieIds, item.id]);
                            }
                          }}
                          className={`p-1 mt-1 rounded-md transition cursor-pointer shrink-0 ${
                            selectedMovieIds.includes(item.id) ? 'text-purple-400' : 'text-slate-655 hover:text-slate-400'
                          }`}
                        >
                          {selectedMovieIds.includes(item.id) ? (
                            <CheckSquare className="w-4.5 h-4.5" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>

                        <img 
                          src={item.posterUrl} 
                          alt={item.title} 
                          className="w-16 h-20 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60"; }}
                          referrerPolicy="no-referrer"
                        />
                        <div 
                          className="min-w-0 flex-1 cursor-pointer select-none"
                          onClick={() => {
                            if (selectedMovieIds.includes(item.id)) {
                              setSelectedMovieIds(selectedMovieIds.filter(id => id !== item.id));
                            } else {
                              setSelectedMovieIds([...selectedMovieIds, item.id]);
                            }
                          }}
                        >
                          <h4 className="font-bold text-sm text-white truncate hover:text-purple-400 transition">{item.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1.5 block truncate max-w-[130px] sm:max-w-[150px]">{item.videoUrl}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => startEditMovie(item)}
                          className="p-1.5 text-slate-300 hover:text-blue-400 hover:bg-slate-900 rounded-lg transition"
                          title="تعديل الفيلم"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMovie(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                          title="حذف الفيلم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SERIES */}
          {activeTab === "series" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Add/Edit */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 h-fit space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {editingId ? "تعديل بيانات المسلسل" : "إضافة مسلسل تلفزيونيใหม่"}
                </h3>

                <form onSubmit={handleSaveSeries} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">عنوان المسلسل *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: قيامة أرطغرل"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">رابط الملصق (بوستر عمودي)</label>
                    <input
                      type="url"
                      placeholder="رابط الصورة المباشر..."
                      value={seriesPoster}
                      onChange={(e) => setSeriesPoster(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">قصة ووصف المسلسل</label>
                    <textarea
                      placeholder="اكتب ملخصاً شيقاً عن أحداث المسلسل الملحمي..."
                      value={seriesDesc}
                      onChange={(e) => setSeriesDesc(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {editingId ? "حفظ التعديلات" : "إنشاء غلاف المسلسل"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetSeriesForm}
                        className="py-2 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-555" />
                    <span>المسلسلات الحالية ({series.length})</span>
                    {selectedSeriesIds.length > 0 && (
                      <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold font-mono">
                        تم تحديد {selectedSeriesIds.length}
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSeriesIds.length === series.length) {
                          setSelectedSeriesIds([]);
                        } else {
                          setSelectedSeriesIds(series.map(s => s.id));
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedSeriesIds.length === series.length ? "إلغاء التحديد" : "تحديد الكل"}</span>
                    </button>

                    {selectedSeriesIds.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={exportSeriesToM3U}
                          className="px-2.5 py-1.5 bg-blue-605 hover:bg-blue-700 text-xs text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold shadow-lg shadow-blue-550/15"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير الحلقات ({selectedSeriesIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDeleteSeries}
                          className="px-2.5 py-1.5 bg-red-650 hover:bg-red-700 text-xs text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold hover:shadow-red-500/10 shadow animate-fade-in"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف المحددة ({selectedSeriesIds.length})</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={exportSeriesToM3U}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-350 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير حلقات الكل</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                  {series.map((item) => (
                    <div key={item.id} className={`p-3 rounded-xl border flex gap-3 justify-between items-start transition ${
                      selectedSeriesIds.includes(item.id)
                        ? 'bg-emerald-600/10 border-emerald-500/40 shadow shadow-emerald-500/5'
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                    }`}>
                      <div className="flex gap-3 min-w-0 flex-1">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedSeriesIds.includes(item.id)) {
                              setSelectedSeriesIds(selectedSeriesIds.filter(id => id !== item.id));
                            } else {
                              setSelectedSeriesIds([...selectedSeriesIds, item.id]);
                            }
                          }}
                          className={`p-1 mt-1 rounded-md transition cursor-pointer shrink-0 ${
                            selectedSeriesIds.includes(item.id) ? 'text-emerald-400' : 'text-slate-655 hover:text-slate-400'
                          }`}
                        >
                          {selectedSeriesIds.includes(item.id) ? (
                            <CheckSquare className="w-4.5 h-4.5" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>

                        <img 
                          src={item.posterUrl} 
                          alt={item.title} 
                          className="w-16 h-20 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60"; }}
                          referrerPolicy="no-referrer"
                        />
                        <div 
                          className="min-w-0 flex-1 cursor-pointer select-none"
                          onClick={() => {
                            if (selectedSeriesIds.includes(item.id)) {
                              setSelectedSeriesIds(selectedSeriesIds.filter(id => id !== item.id));
                            } else {
                              setSelectedSeriesIds([...selectedSeriesIds, item.id]);
                            }
                          }}
                        >
                          <h4 className="font-bold text-sm text-white truncate hover:text-emerald-400 transition">{item.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 inline-block mt-2 font-bold font-mono">
                            {seasons.filter(s => s.seriesId === item.id).length} مواسم
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => startEditSeries(item)}
                          className="p-1.5 text-slate-300 hover:text-blue-400 hover:bg-slate-900 rounded-lg transition"
                          title="تعديل غلاف وقصة المسلسل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSeries(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                          title="حذف المسلسل بالكامل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEASONS & EPISODES */}
          {activeTab === "episodes" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Season addition & Selected parent selectors */}
              <div className="space-y-6">
                {/* Selectors card */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">1. تحديد المسلسل المستهدف</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">اختر المسلسل الرئيسي</label>
                      <select
                        value={selectedSeriesId}
                        onChange={(e) => setSelectedSeriesId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                      >
                        <option value="">-- اختر المسلسل --</option>
                        {series.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">اختر الموسم التابع</label>
                      <select
                        value={selectedSeasonId}
                        onChange={(e) => setSelectedSeasonId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                        disabled={!selectedSeriesId}
                      >
                        <option value="">-- اختر الموسم --</option>
                        {seasons.filter(s => s.seriesId === selectedSeriesId).map(s => (
                          <option key={s.id} value={s.id}>{s.title} (موسم {s.seasonNumber})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Season Management form */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">2. إنشاء موسم جديد لهذا المسلسل</h3>
                  
                  <form onSubmit={handleAddSeason} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">عنوان الموسم (مثال: الموسم الأول)</label>
                        <input
                          type="text"
                          required
                          value={newSeasonTitle}
                          onChange={(e) => setNewSeasonTitle(e.target.value)}
                          placeholder="الموسم الأول"
                          className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">رقم الموسم</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newSeasonNum}
                          onChange={(e) => setNewSeasonNum(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!selectedSeriesId}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      تأكيد إنشاء الموسم
                    </button>
                  </form>

                  {/* List of Seasons for current series */}
                  {selectedSeriesId && (
                    <div className="mt-3">
                      <div className="text-xs font-bold text-slate-400 mb-1.5">المواسم المسجلة حالياً:</div>
                      <div className="space-y-1 max-h-[160px] overflow-y-auto">
                        {seasons.filter(s => s.seriesId === selectedSeriesId).map(s => (
                          <div key={s.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-850">
                            <span className="text-xs font-bold">{s.title} (رقم {s.seasonNumber})</span>
                            <button
                              onClick={() => handleDeleteSeason(s.id)}
                              className="p-1 hover:bg-red-500/15 text-slate-400 hover:text-red-400 rounded transition"
                              title="حذف الموسم بالكامل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Episode addition list */}
              <div className="space-y-6">
                {/* Episode Save form */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-4">
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">3. {editingId ? "تعديل الحلقة" : "إضافة حلقة جديدة للموسم"}</h3>
                  
                  <form onSubmit={handleSaveEpisode} className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-3">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">عنوان الحلقة *</label>
                        <input
                          type="text"
                          required
                          value={epTitle}
                          onChange={(e) => setEpTitle(e.target.value)}
                          placeholder="مثال: الحلقة 1: القرار الصعب والرحيل"
                          className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">رقم الحلقة</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={epNum}
                          onChange={(e) => setEpNum(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">رابط الفيديو المستهدف (HLS .m3u8 / MP4) *</label>
                      <input
                        type="text"
                        required
                        value={epStream}
                        onChange={(e) => setEpStream(e.target.value)}
                        placeholder="Http://..."
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500 text-sm text-white font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedSeriesId || !selectedSeasonId}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {editingId ? "حفظ تعديلات الحلقة" : "إضافة الحلقة وقفل الرابط"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setEpTitle(""); setEpStream(""); }}
                        className="w-full py-1.5 bg-slate-850 text-slate-300 rounded-xl text-xs"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </form>
                </div>

                {/* List of episodes for current Season */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-850 space-y-3">
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">الحلقات التابعة للموسم المحدد ({episodes.filter(e => e.seasonId === selectedSeasonId).length})</h3>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {episodes.filter(e => e.seasonId === selectedSeasonId).map(e => (
                      <div key={e.id} className="p-2 bg-slate-950 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="bg-blue-500/10 text-blue-300 font-bold font-mono px-1.5 py-0.2 rounded border border-blue-500/20">
                              ع {e.episodeNumber}
                            </span>
                            <span>{e.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-1 truncate max-w-[200px]">{e.videoUrl}</span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditEpisode(e)}
                            className="p-1 text-slate-300 hover:text-blue-400 hover:bg-slate-900 rounded"
                            title="تعديل الحلقة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEpisode(e.id)}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded"
                            title="حذف الحلقة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {selectedSeasonId && episodes.filter(e => e.seasonId === selectedSeasonId).length === 0 && (
                      <p className="text-xs text-slate-500 py-4 text-center">لا توجد أي حلقات مسجلة في هذا الموسم حالياً.</p>
                    )}
                    {!selectedSeasonId && (
                      <p className="text-xs text-slate-500 py-4 text-center">يرجى تحديد مسلسل وموسم لعرض أو إضافة حلقاته.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* M3U Export Modal Overlay */}
      {exportedM3uText && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-right animate-scale-in">
            {/* Header */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-md font-bold text-white">تصدير قائمة التشغيل M3U8</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setExportedM3uText(""); setCopiedSuccess(false); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                قائمة التشغيل جاهزة! يمكنك نسخ محتويات الملف مباشرة من المربع أدناه لاستخدامها في أي مشغل IPTV أو الضغط على "تحميل كملف" للحصول على ملف <b>.m3u8</b> خارجي.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  value={exportedM3uText}
                  className="w-full h-80 px-4 py-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 focus:border-blue-550/50 outline-none text-[10px] sm:text-xs font-mono resize-none leading-normal"
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
                
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(exportedM3uText);
                      setCopiedSuccess(true);
                      setTimeout(() => setCopiedSuccess(false), 2000);
                    }}
                    className={`px-3 py-1.5 ${copiedSuccess ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'} text-xs font-bold rounded-lg border border-slate-850 transition flex items-center gap-1.5`}
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSuccess ? "تم النسخ!" : "نسخ المحتوى"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setExportedM3uText(""); setCopiedSuccess(false); }}
                className="px-4 py-2 bg-slate-855 hover:bg-slate-800 text-xs text-slate-300 font-bold rounded-xl transition cursor-pointer"
              >
                إغلاق النافذة
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadFile(exportedM3uText, "staad_playlist.m3u8");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-500/15"
              >
                <Download className="w-4 h-4" />
                <span>تحميل كملف m3u.</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
