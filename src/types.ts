export interface PlayerStats {
  address: string;
  balance: number;
  rank: number;
  winRate: number;
  totalMatches: number;
  genShatards: number;
}

export interface MatchRecord {
  id: string;
  timestamp: string;
  mode: string;
  placement: number;
  reward: number;
  txHash: string;
  status: 'Confirmed' | 'Pending Validator Sync';
}

export interface Lobby {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  players: number;
  maxPlayers: number;
  shard: string;
  status: 'Open' | 'In Progress' | 'Settling';
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  winRate: number;
  totalEarnings: number;
  tier: 'Grandmaster' | 'Master' | 'Diamond' | 'Platinum' | 'Gold';
}
