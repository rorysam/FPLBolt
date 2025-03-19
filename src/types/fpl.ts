export interface LeagueStanding {
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  total: number;
  entry: number;
  event_total: number;
  gameweek: number;
  history: {
    gameweek: number;
    rank: number;
    total: number;
  }[];
  chips: {
    name: string;
    gameweek: number;
    used: boolean;
  }[];
}

export interface RankChange {
  team: LeagueStanding;
  currentPosition: number;
  previousPosition: number;
  positionChange: number;
  currentTotal: number;
  previousTotal: number;
}

export interface GameweekSummary {
  gameweek: number;
  standings: LeagueStanding[];
  topScorer: LeagueStanding;
  biggestRiser: LeagueStanding;
  biggestFaller: LeagueStanding;
  rankChanges: RankChange[];
  narrative: {
    keyEvents: string[];
    individualPerformances: {
      team: LeagueStanding;
      narrative: string;
    }[];
  };
}