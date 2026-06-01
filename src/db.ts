import { isFirebaseConfigured, db } from "./firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocFromServer 
} from "firebase/firestore";
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
  INITIAL_CHANNELS, 
  INITIAL_MATCHES, 
  INITIAL_MOVIES, 
  INITIAL_SERIES, 
  INITIAL_SEASONS, 
  INITIAL_EPISODES 
} from "./initialData";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Error logger as mandated by Firebase integration guidelines
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error("Firestore Error Blocked:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- HELPER TO INTIALIZE LOCALSTORAGE ---
function getLocalItem<T>(key: string, initial: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return initial;
  }
}

function setLocalItem<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Ensure pre-population in LocalStorage so the user gets stunning instant content
const initLocalDB = () => {
  getLocalItem("staad_channels", INITIAL_CHANNELS);
  getLocalItem("staad_matches", INITIAL_MATCHES);
  getLocalItem("staad_movies", INITIAL_MOVIES);
  getLocalItem("staad_series", INITIAL_SERIES);
  getLocalItem("staad_seasons", INITIAL_SEASONS);
  getLocalItem("staad_episodes", INITIAL_EPISODES);
};
initLocalDB();

// --- CHANNELS SERVICES ---
export async function fetchChannels(): Promise<Channel[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "channels"));
      const list: Channel[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Channel);
      });
      return list.length > 0 ? list : INITIAL_CHANNELS;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "channels");
      return INITIAL_CHANNELS;
    }
  } else {
    return getLocalItem<Channel[]>("staad_channels", INITIAL_CHANNELS);
  }
}

export async function saveChannel(channel: Channel): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "channels", channel.id), channel);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channel.id}`);
    }
  } else {
    const list = getLocalItem<Channel[]>("staad_channels", INITIAL_CHANNELS);
    const index = list.findIndex(c => c.id === channel.id);
    if (index >= 0) {
      list[index] = channel;
    } else {
      list.push(channel);
    }
    setLocalItem("staad_channels", list);
  }
}

export async function removeChannel(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "channels", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `channels/${id}`);
    }
  } else {
    const list = getLocalItem<Channel[]>("staad_channels", INITIAL_CHANNELS);
    const filtered = list.filter(c => c.id !== id);
    setLocalItem("staad_channels", filtered);
  }
}

// --- MATCHES SERVICES ---
export async function fetchMatches(): Promise<LiveMatch[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "matches"));
      const list: LiveMatch[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as LiveMatch);
      });
      return list.length > 0 ? list : INITIAL_MATCHES;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "matches");
      return INITIAL_MATCHES;
    }
  } else {
    return getLocalItem<LiveMatch[]>("staad_matches", INITIAL_MATCHES);
  }
}

export async function saveMatch(match: LiveMatch): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "matches", match.id), match);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `matches/${match.id}`);
    }
  } else {
    const list = getLocalItem<LiveMatch[]>("staad_matches", INITIAL_MATCHES);
    const index = list.findIndex(m => m.id === match.id);
    if (index >= 0) {
      list[index] = match;
    } else {
      list.push(match);
    }
    setLocalItem("staad_matches", list);
  }
}

export async function removeMatch(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "matches", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `matches/${id}`);
    }
  } else {
    const list = getLocalItem<LiveMatch[]>("staad_matches", INITIAL_MATCHES);
    const filtered = list.filter(m => m.id !== id);
    setLocalItem("staad_matches", filtered);
  }
}

// --- MOVIES SERVICES ---
export async function fetchMovies(): Promise<Movie[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "movies"));
      const list: Movie[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Movie);
      });
      return list.length > 0 ? list : INITIAL_MOVIES;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "movies");
      return INITIAL_MOVIES;
    }
  } else {
    return getLocalItem<Movie[]>("staad_movies", INITIAL_MOVIES);
  }
}

export async function saveMovie(movie: Movie): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "movies", movie.id), movie);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `movies/${movie.id}`);
    }
  } else {
    const list = getLocalItem<Movie[]>("staad_movies", INITIAL_MOVIES);
    const index = list.findIndex(m => m.id === movie.id);
    if (index >= 0) {
      list[index] = movie;
    } else {
      list.push(movie);
    }
    setLocalItem("staad_movies", list);
  }
}

export async function removeMovie(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "movies", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `movies/${id}`);
    }
  } else {
    const list = getLocalItem<Movie[]>("staad_movies", INITIAL_MOVIES);
    const filtered = list.filter(m => m.id !== id);
    setLocalItem("staad_movies", filtered);
  }
}

// --- SERIES SERVICES ---
export async function fetchSeries(): Promise<Series[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "series"));
      const list: Series[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Series);
      });
      return list.length > 0 ? list : INITIAL_SERIES;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "series");
      return INITIAL_SERIES;
    }
  } else {
    return getLocalItem<Series[]>("staad_series", INITIAL_SERIES);
  }
}

export async function saveSeries(seriesItem: Series): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "series", seriesItem.id), seriesItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `series/${seriesItem.id}`);
    }
  } else {
    const list = getLocalItem<Series[]>("staad_series", INITIAL_SERIES);
    const index = list.findIndex(s => s.id === seriesItem.id);
    if (index >= 0) {
      list[index] = seriesItem;
    } else {
      list.push(seriesItem);
    }
    setLocalItem("staad_series", list);
  }
}

export async function removeSeries(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "series", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `series/${id}`);
    }
  } else {
    const list = getLocalItem<Series[]>("staad_series", INITIAL_SERIES);
    const filtered = list.filter(s => s.id !== id);
    setLocalItem("staad_series", filtered);

    // Clean up corresponding seasons & episodes locally
    const seasons = getLocalItem<Season[]>("staad_seasons", INITIAL_SEASONS);
    const filteredSeasons = seasons.filter(s => s.seriesId !== id);
    setLocalItem("staad_seasons", filteredSeasons);

    const episodes = getLocalItem<Episode[]>("staad_episodes", INITIAL_EPISODES);
    const filteredEpisodes = episodes.filter(e => e.seriesId !== id);
    setLocalItem("staad_episodes", filteredEpisodes);
  }
}

// --- SEASONS SERVICES ---
export async function fetchSeasons(): Promise<Season[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "seasons"));
      const list: Season[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Season);
      });
      return list.length > 0 ? list : INITIAL_SEASONS;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "seasons");
      return INITIAL_SEASONS;
    }
  } else {
    return getLocalItem<Season[]>("staad_seasons", INITIAL_SEASONS);
  }
}

export async function saveSeason(season: Season): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "seasons", season.id), season);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `seasons/${season.id}`);
    }
  } else {
    const list = getLocalItem<Season[]>("staad_seasons", INITIAL_SEASONS);
    const index = list.findIndex(s => s.id === season.id);
    if (index >= 0) {
      list[index] = season;
    } else {
      list.push(season);
    }
    setLocalItem("staad_seasons", list);
  }
}

export async function removeSeason(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "seasons", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `seasons/${id}`);
    }
  } else {
    const list = getLocalItem<Season[]>("staad_seasons", INITIAL_SEASONS);
    const filtered = list.filter(s => s.id !== id);
    setLocalItem("staad_seasons", filtered);

    // Clean up episodes locally
    const episodes = getLocalItem<Episode[]>("staad_episodes", INITIAL_EPISODES);
    const filteredEpisodes = episodes.filter(e => e.seasonId !== id);
    setLocalItem("staad_episodes", filteredEpisodes);
  }
}

// --- EPISODES SERVICES ---
export async function fetchEpisodes(): Promise<Episode[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "episodes"));
      const list: Episode[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Episode);
      });
      return list.length > 0 ? list : INITIAL_EPISODES;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "episodes");
      return INITIAL_EPISODES;
    }
  } else {
    return getLocalItem<Episode[]>("staad_episodes", INITIAL_EPISODES);
  }
}

export async function saveEpisode(episode: Episode): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "episodes", episode.id), episode);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `episodes/${episode.id}`);
    }
  } else {
    const list = getLocalItem<Episode[]>("staad_episodes", INITIAL_EPISODES);
    const index = list.findIndex(e => e.id === episode.id);
    if (index >= 0) {
      list[index] = episode;
    } else {
      list.push(episode);
    }
    setLocalItem("staad_episodes", list);
  }
}

export async function removeEpisode(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "episodes", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `episodes/${id}`);
    }
  } else {
    const list = getLocalItem<Episode[]>("staad_episodes", INITIAL_EPISODES);
    const filtered = list.filter(e => e.id !== id);
    setLocalItem("staad_episodes", filtered);
  }
}

// Check connection on boot as mandated
export async function testConnection() {
  if (isFirebaseConfigured && db) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }
}
testConnection();
