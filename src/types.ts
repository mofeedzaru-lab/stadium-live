export enum ChannelCategory {
  SPORTS = "sports",
  NEWS = "news",
  GENERAL = "general"
}

export enum MatchStatus {
  SCHEDULED = "scheduled",
  LIVE = "live",
  FINISHED = "finished"
}

export interface Channel {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl: string;
  category: ChannelCategory;
}

export interface LiveMatch {
  id: string;
  title: string;
  teamHome: string;
  teamAway: string;
  teamHomeLogo?: string;
  teamAwayLogo?: string;
  tournamentName: string;
  matchTime: string; // ISO string or human date
  streamUrl: string;
  status: MatchStatus;
  channelId?: string;
  scoreHome?: number;
  scoreAway?: number;
}

export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  description: string;
  videoUrl: string;
}

export interface Series {
  id: string;
  title: string;
  posterUrl: string;
  description: string;
}

export interface Season {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
}

export interface AdminCredentials {
  isAdminSession: boolean;
  username?: string;
}
