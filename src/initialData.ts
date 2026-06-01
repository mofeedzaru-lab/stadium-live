import { Channel, ChannelCategory, LiveMatch, MatchStatus, Movie, Series, Season, Episode } from "./types";

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: "bein-sports",
    name: "بي إن سبورتس الإخبارية",
    logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=60",
    streamUrl: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    category: ChannelCategory.SPORTS
  },
  {
    id: "alkass-one",
    name: "قناة الكأس الرياضية",
    logoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=150&auto=format&fit=crop&q=60",
    streamUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8",
    category: ChannelCategory.SPORTS
  },
  {
    id: "al-jazeera",
    name: "قناة الجزيرة الإخبارية",
    logoUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&auto=format&fit=crop&q=60",
    streamUrl: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8",
    category: ChannelCategory.NEWS
  },
  {
    id: "bbc-arabic",
    name: "بي بي سي عربي",
    logoUrl: "https://images.unsplash.com/photo-1495020689067-958852a6565d?w=150&auto=format&fit=crop&q=60",
    streamUrl: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    category: ChannelCategory.NEWS
  },
  {
    id: "mbc-one",
    name: "إم بي سي 1",
    logoUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=150&auto=format&fit=crop&q=60",
    streamUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8",
    category: ChannelCategory.GENERAL
  },
  {
    id: "rotana-cinema",
    name: "روتانا سينما",
    logoUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&auto=format&fit=crop&q=60",
    streamUrl: "https://test-streams.mux.dev/x36xhg/main.m3u8",
    category: ChannelCategory.GENERAL
  }
];

export const INITIAL_MATCHES: LiveMatch[] = [
  {
    id: "match-1",
    title: "ريال مدريد ضد برشلونة",
    teamHome: "ريال مدريد",
    teamAway: "برشلونة",
    teamHomeLogo: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&auto=format&fit=crop&q=60",
    teamAwayLogo: "https://images.unsplash.com/photo-1540747737956-378724044453?w=100&auto=format&fit=crop&q=60",
    tournamentName: "الدوري الإسباني (البث المباشر)",
    matchTime: new Date(Date.now()).toISOString(), // Currently live
    streamUrl: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    status: MatchStatus.LIVE,
    channelId: "bein-sports",
    scoreHome: 2,
    scoreAway: 1
  },
  {
    id: "match-2",
    title: "مانشستر سيتي ضد ليفربول",
    teamHome: "مانشستر سيتي",
    teamAway: "ليفربول",
    teamHomeLogo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=60",
    teamAwayLogo: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=60",
    tournamentName: "الدوري الإنجليزي",
    matchTime: new Date(Date.now() + 2 * 3600000).toISOString(), // Starts in 2 hours
    streamUrl: "https://test-streams.mux.dev/x36xhg/main.m3u8",
    status: MatchStatus.SCHEDULED,
    channelId: "alkass-one",
    scoreHome: 0,
    scoreAway: 0
  },
  {
    id: "match-3",
    title: "الأهلي ضد الزمالك",
    teamHome: "الأهلي",
    teamAway: "الزمالك",
    teamHomeLogo: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&auto=format&fit=crop&q=60",
    teamAwayLogo: "https://images.unsplash.com/photo-1540747737956-378724044453?w=100&auto=format&fit=crop&q=60",
    tournamentName: "دوري أبطال أفريقيا",
    matchTime: new Date(Date.now() - 4 * 3600000).toISOString(), // Finished
    streamUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8",
    status: MatchStatus.FINISHED,
    channelId: "alkass-one",
    scoreHome: 3,
    scoreAway: 2
  }
];

export const INITIAL_MOVIES: Movie[] = [
  {
    id: "movie-1",
    title: "فجر الحارس (The Watcher)",
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60",
    description: "في قلب إمبراطورية قديمة، يستيقظ حارس غامض ليكتشف حقيقة المؤامرة التي تحاك في الخفاء لإنهاء السلام الممتد لقرون.",
    videoUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8"
  },
  {
    id: "movie-2",
    title: "شجاعة الفارس اللانهائية",
    posterUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&auto=format&fit=crop&q=60",
    description: "مغامرة ملحمية في تضاريس وعرة، يواجه فيها بطل عربي تحديات الطبيعة والخصوم لاستعادة شرف قبيلته.",
    videoUrl: "https://test-streams.mux.dev/x36xhg/main.m3u8"
  },
  {
    id: "movie-3",
    title: "الرحلة الأخيرة إلى الكوكب المفقود",
    posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60",
    description: "بعثة فضائية مشحونة بالمخاطر تهبط على كوكب بعيد لكشف غموض إشارات غريبة مرسلة عبر الفضاء العميق.",
    videoUrl: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
  }
];

export const INITIAL_SERIES: Series[] = [
  {
    id: "series-1",
    title: "مسلسل أرطغرل: بزوغ الإمبراطورية",
    posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60",
    description: "دراما تاريخية ملحمية تصور قصة حياة أرطغرل وتأسيس الدولة العثمانية بين الصراعات والغزوات."
  },
  {
    id: "series-2",
    title: "المحقق الصغير وغامض الرموز",
    posterUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&auto=format&fit=crop&q=60",
    description: "قضايا مخابراتية معقدة يتم كشفها عبر عيون محقق ذكي يحل الكهوف المشفرة ويفك طلاسم الجرائم الحضرية."
  }
];

export const INITIAL_SEASONS: Season[] = [
  {
    id: "season-1-1",
    seriesId: "series-1",
    seasonNumber: 1,
    title: "الموسم الأول: البدايات"
  },
  {
    id: "season-1-2",
    seriesId: "series-1",
    seasonNumber: 2,
    title: "الموسم الثاني: صراع القبائل"
  },
  {
    id: "season-2-1",
    seriesId: "series-2",
    seasonNumber: 1,
    title: "الموسم الأول: فك الرموز"
  }
];

export const INITIAL_EPISODES: Episode[] = [
  // Series 1, Season 1
  {
    id: "episode-1-1-1",
    seriesId: "series-1",
    seasonId: "season-1-1",
    episodeNumber: 1,
    title: "الحلقة 1: القرار الصعب والرحيل المفاجئ",
    videoUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8"
  },
  {
    id: "episode-1-1-2",
    seriesId: "series-1",
    seasonId: "season-1-1",
    episodeNumber: 2,
    title: "الحلقة 2: المعركة الصغرى وحصار التتار",
    videoUrl: "https://test-streams.mux.dev/x36xhg/main.m3u8"
  },
  {
    id: "episode-1-1-3",
    seriesId: "series-1",
    seasonId: "season-1-1",
    episodeNumber: 3,
    title: "الحلقة 3: تحالفات الغدر والمكيدة",
    videoUrl: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
  },
  // Series 1, Season 2
  {
    id: "episode-1-2-1",
    seriesId: "series-1",
    seasonId: "season-1-2",
    episodeNumber: 1,
    title: "الحلقة 1: الفجر الجديد والمواجهة الكبرى",
    videoUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8"
  },
  {
    id: "episode-1-2-2",
    seriesId: "series-1",
    seasonId: "season-1-2",
    episodeNumber: 2,
    title: "الحلقة 2: كسر الحصار واستعادة الشرف",
    videoUrl: "https://test-streams.mux.dev/x36xhg/main.m3u8"
  },
  // Series 2, Season 1
  {
    id: "episode-2-1-1",
    seriesId: "series-2",
    seasonId: "season-2-1",
    episodeNumber: 1,
    title: "الحلقة 1: خيوط في الظلام وظهور القضية الأولى",
    videoUrl: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8"
  },
  {
    id: "episode-2-1-2",
    seriesId: "series-2",
    seasonId: "season-2-1",
    episodeNumber: 2,
    title: "الحلقة 2: الضحية الثانية والرسالة المربكة",
    videoUrl: "https://test-streams.mux.dev/x36xhg/main.m3u8"
  }
];
