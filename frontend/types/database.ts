// Database entity types for The Great Holyoke Brick Race

export interface Race {
  id: string
  name: string
  date: string
  location?: string
  description?: string
  image_url?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Racer {
  id: string
  name: string
  racer_number: number
  weight?: number
  team_members?: string
  user_id: string
  image_url?: string
  photos?: string[]
  videos?: string[]
  created_at: string
  updated_at: string
}

export interface RaceWithdrawal {
  id: string
  race_id: string
  racer_id: string
  withdrawn_at: string
  withdrawn_by?: string
  reason?: string
}

export interface Award {
  id: string
  name: string
  description?: string
  image_url?: string
  category: 'speed' | 'creativity' | 'artistry' | 'special'
  race_id?: string
  created_at: string
  updated_at: string
}

export interface Sponsor {
  id: string
  name: string
  website_url?: string
  logo_url?: string
  sponsorship_amount?: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface AwardWinner {
  id: string
  award_id: string
  racer_id: string
  race_id: string
  notes?: string
  created_at: string
}

export interface GeneralPhoto {
  id: string
  url: string
  category: 'crowd' | 'setup' | 'awards' | 'venue' | 'action' | 'general'
  description?: string
  race_id?: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  credit?: string
  uploaded_at: string
  created_at: string
  updated_at: string
}

export interface Photo {
  url: string
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  uploaded_at?: string
}

export interface CheckIn {
  id: string
  racer_id: string
  race_id: string
  time: string
  created_at: string
}

export interface Qualifier {
  id: string
  racer_id: string
  race_id: string
  time: number
  notes?: string
  created_at: string
}

export interface Bracket {
  id: string
  race_id: string
  track1_racer_id?: string
  track2_racer_id?: string
  track1_time?: number
  track2_time?: number
  bracket_type: 'double_elimination' | 'single_elimination' | 'Fastest' | 'Slowest'
  bracket_group?: 'winner' | 'loser' | 'final'
  round_number?: number
  match_number?: number
  winner_racer_id?: string
  winner_track?: number
  parent_bracket_winner_id?: string
  parent_bracket_loser_id?: string
  is_forfeit?: boolean
  forfeit_reason?: string
  challonge_match_id?: string
  challonge_round?: number
  challonge_suggested_play_order?: number
  created_at: string
  updated_at?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Form data types
export interface RacerFormData {
  name: string
  builder_name: string
  builder_email?: string
  description?: string
  image_url?: string
}

export interface RaceFormData {
  name: string
  date: string
  location?: string
  description?: string
  image_url?: string
  active: boolean
}

export interface GeneralPhotoFormData {
  url: string
  category: GeneralPhoto['category']
  description?: string
  race_id?: string
  credit?: string
}

// Challonge Integration Types
export interface ChallongeTournament {
  id: string
  race_id: string
  challonge_tournament_id: string
  challonge_url: string
  tournament_type: 'single_elimination' | 'double_elimination'
  status: 'pending' | 'active' | 'completed'
  embed_url?: string
  created_at: string
  updated_at: string
}

export interface ChallongeParticipant {
  id: string
  challonge_tournament_id: string
  racer_id: string
  challonge_participant_id: string
  seed_position?: number
  created_at: string
}

export interface ChallongeTournamentFormData {
  name: string
  description?: string
  tournament_type: ChallongeTournament['tournament_type']
}

export interface ChallongeParticipantWithRacer extends ChallongeParticipant {
  racer: Racer
  best_time?: number
}

export interface ChallongeMatchSync {
  id: string
  bracket_id: string
  challonge_tournament_id: string
  challonge_match_id: string
  winner_participant_id: string
  scores_csv: string
  synced_at: string
  created_at: string
}
