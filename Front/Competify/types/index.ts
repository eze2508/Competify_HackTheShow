// User Types
export type VinylRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface User {
  id: string;
  spotifyId?: string;
  username: string;
  avatarUrl?: string;
  rank: VinylRank;
  totalHours: number;
  currentMonthHours: number;
  currentWeekHours: number;
  totalArtists: number;
}

// Artist Types
export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  followers?: number;
}

export interface TopArtist extends Artist {
  hours: number;
}

// Ranking Types
export type TimePeriod = 'week' | 'month' | 'year' | 'all-time';

export interface RankingEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  hours: number;
  rank: VinylRank;
  isCurrentUser?: boolean;
}

export interface Rankings {
  week: RankingEntry[];
  month: RankingEntry[];
  year: RankingEntry[];
  'all-time': RankingEntry[];
}

// Stats Types
export interface UserStats {
  userId: string;
  period: TimePeriod;
  hours: number;
  topArtists: TopArtist[];
}

// Achievement Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

// API Response Types
export interface SpotifyArtistResponse {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
  genres: string[];
  followers: { total: number };
}

export interface SpotifyTrackResponse {
  track: {
    artists: Array<{ id: string; name: string }>;
    duration_ms: number;
  };
  played_at: string;
}

// Utility Types
export interface SearchFilters {
  query: string;
  genre?: string;
}

export interface StatsCardData {
  label: string;
  value: string | number;
  icon?: string;
  gradient?: boolean;
}

// Navigation Types
export type RootStackParamList = {
  profile: undefined;
  ranking: undefined;
  explore: undefined;
};
