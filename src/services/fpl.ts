import axios from 'axios';
import { LeagueStanding, GameweekSummary, RankChange } from '../types/fpl';

// Create base API URL based on environment
const API_BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions/fpl-proxy'
  : '/fpl-api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json'
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    
    if (error.response) {
      const status = error.response.status;
      const errorMessages = {
        404: 'FPL API endpoint not found. Please try again later.',
        429: 'Too many requests. Please wait a moment and try again.',
        503: 'FPL API is currently unavailable. Please try again later.',
        500: 'FPL API server error. Please try again later.',
        502: 'Bad gateway error. Please try again later.',
        504: 'Gateway timeout. Please try again later.'
      };
      throw new Error(errorMessages[status] || 'Failed to fetch data from FPL API. Please try again.');
    }
    
    if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw new Error('An unexpected error occurred. Please try again.');
  }
);

// Retry mechanism for failed requests with exponential backoff
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    const delay = baseDelay * Math.pow(2, 3 - retries);
    console.log(`Retrying request after ${delay}ms... (${retries} attempts remaining)`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, baseDelay);
  }
}

interface FPLLeagueResponse {
  league: {
    id: number;
    name: string;
    created: string;
    closed: boolean;
    max_entries: number | null;
    league_type: string;
    scoring: string;
    admin_entry: number;
    start_event: number;
    code_privacy: string;
    has_cup: boolean;
    cup_league: null;
    rank: null;
  };
  new_entries: [];
  standings: {
    has_next: boolean;
    page: number;
    results: Array<{
      id: number;
      event_total: number;
      player_name: string;
      rank: number;
      last_rank: number;
      rank_sort: number;
      total: number;
      entry: number;
      entry_name: string;
      event_transfers: number;
      event_transfers_cost: number;
      value: number;
      points_on_bench: number;
      bank: number;
      entry_value: number;
    }>;
  };
}

interface FPLBootstrapResponse {
  events: Array<{
    id: number;
    finished: boolean;
    current: boolean;
    name: string;
  }>;
}

interface FPLEntryHistoryResponse {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    event_transfers_cost: number;
  }>;
  chips: Array<{
    name: string;
    time: string;
    event: number;
  }>;
}

interface FPLTeamResponse {
  leagues: {
    classic: any[];
    h2h: any[];
    cup: any;
  };
  chips: Array<{
    name: string;
    time: string;
    event: number;
  }>;
}

let bootstrapCache: FPLBootstrapResponse | null = null;
let currentGameweekCache: number | null = null;

async function fetchLeagueDetails(leagueId: number, gameweek: number): Promise<FPLLeagueResponse> {
  return fetchWithRetry(async () => {
    const response = await api.get(`/leagues-classic/${leagueId}/standings/?event=${gameweek}`);
    return response.data;
  });
}

async function fetchBootstrapData(): Promise<FPLBootstrapResponse> {
  if (bootstrapCache) {
    return bootstrapCache;
  }
  
  return fetchWithRetry(async () => {
    const response = await api.get('/bootstrap-static/');
    bootstrapCache = response.data;
    return response.data;
  });
}

export async function getCurrentGameweek(): Promise<number> {
  if (currentGameweekCache !== null) {
    return currentGameweekCache;
  }
  const bootstrap = await fetchBootstrapData();
  const currentGw = bootstrap.events.find(event => event.current)?.id || 
                   bootstrap.events.findLast(event => event.finished)?.id || 1;
  currentGameweekCache = currentGw;
  return currentGw;
}

async function fetchTeamHistory(teamId: number, selectedGameweek: number): Promise<FPLEntryHistoryResponse> {
  return fetchWithRetry(async () => {
    const response = await api.get(`/entry/${teamId}/history/`);
    const data = response.data;
    
    // Filter history up to the selected gameweek
    data.current = data.current
      .filter(gw => gw.event <= selectedGameweek)
      .map((gw, _, arr) => ({
        ...gw,
        total_points: arr
          .filter(h => h.event <= gw.event)
          .reduce((sum, h) => sum + h.points - h.event_transfers_cost, 0)
      }));
    
    // Filter chips used up to the selected gameweek
    data.chips = data.chips.filter(chip => chip.event <= selectedGameweek);
    
    return data;
  });
}

async function fetchTeamInfo(teamId: number): Promise<FPLTeamResponse> {
  return fetchWithRetry(async () => {
    const response = await api.get(`/entry/${teamId}/`);
    return response.data;
  }).catch(() => ({
    leagues: { classic: [], h2h: [], cup: null },
    chips: []
  }));
}

function normalizeChipName(name: string): string {
  const chipMap = {
    '3xc': 'triple_captain',
    'bboost': 'bench_boost',
    'freehit': 'freehit',
    'wildcard': 'wildcard'
  };
  return chipMap[name] || name;
}

function getPerformanceEmoji(pointsVsAvg: number, rankChange: number, formTrend: number): string {
  if (pointsVsAvg > 20 && rankChange > 2) return "🔥";
  if (pointsVsAvg > 20) return "⭐";
  if (pointsVsAvg > 10 && rankChange > 0) return "📈";
  if (pointsVsAvg > 10) return "✨";
  if (Math.abs(pointsVsAvg) <= 10 && rankChange > 0) return "↗️";
  if (Math.abs(pointsVsAvg) <= 10 && rankChange === 0) return "➡️";
  if (Math.abs(pointsVsAvg) <= 10 && rankChange < 0) return "↘️";
  if (pointsVsAvg < -10 && rankChange < -2) return "📉";
  if (pointsVsAvg < -10) return "😓";
  if (pointsVsAvg < -20) return "💔";
  if (formTrend > 1) return "🚀";
  if (formTrend < -1) return "📉";
  return "⚔️";
}

function getPositionEmoji(rank: number, totalTeams: number): string {
  if (rank === 1) return "👑";
  if (rank <= 3) return "🏆";
  if (rank <= Math.floor(totalTeams * 0.25)) return "🎯";
  if (rank <= Math.floor(totalTeams * 0.5)) return "⚔️";
  if (rank > Math.floor(totalTeams * 0.75)) return "⚠️";
  return "🛡️";
}

function calculateRankChanges(standings: LeagueStanding[], selectedGameweek: number): RankChange[] {
  const previousGameweek = selectedGameweek - 1;
  
  const teamRanks = standings.map(team => {
    const currentGwHistory = team.history.find(h => h.gameweek === selectedGameweek);
    const previousGwHistory = team.history.find(h => h.gameweek === previousGameweek);
    
    return {
      entry: team.entry,
      team,
      currentTotal: currentGwHistory?.total || 0,
      previousTotal: previousGwHistory?.total || 0
    };
  });

  const previousRanks = [...teamRanks]
    .sort((a, b) => b.previousTotal - a.previousTotal)
    .map((team, index) => ({
      entry: team.entry,
      rank: index + 1,
      total: team.previousTotal
    }));

  const currentRanks = [...teamRanks]
    .sort((a, b) => b.currentTotal - a.currentTotal)
    .map((team, index) => ({
      entry: team.entry,
      rank: index + 1,
      total: team.currentTotal
    }));

  return teamRanks.map(team => {
    const previousRank = previousRanks.find(r => r.entry === team.entry)!;
    const currentRank = currentRanks.find(r => r.entry === team.entry)!;
    
    return {
      team: team.team,
      currentPosition: currentRank.rank,
      previousPosition: previousRank.rank,
      positionChange: previousRank.rank - currentRank.rank,
      currentTotal: currentRank.total,
      previousTotal: previousRank.total
    };
  });
}

function generateIndividualNarrative(
  team: LeagueStanding,
  avgPoints: number,
  totalTeams: number,
  previousPosition: number,
  currentPosition: number
): string {
  const recentForm = team.history.slice(-3);
  const formTrend = recentForm.reduce((acc, gw, i, arr) => {
    if (i === 0) return acc;
    return acc + (gw.total > arr[i - 1].total ? 1 : -1);
  }, 0);

  const rankChange = previousPosition - currentPosition;
  const pointsVsAvg = team.event_total - avgPoints;
  const performanceEmoji = getPerformanceEmoji(pointsVsAvg, rankChange, formTrend);
  const positionEmoji = getPositionEmoji(currentPosition, totalTeams);

  const performanceDescriptors = {
    excellent: ["dominated", "crushed it", "absolutely smashed it", "had a masterclass"],
    good: ["impressed", "showed great form", "delivered strong results"],
    average: ["stayed steady", "maintained form", "kept pace"],
    poor: ["struggled", "had a tough time", "faced challenges"],
    terrible: ["had a nightmare", "hit rock bottom", "suffered badly"]
  };

  const rankChangeDescriptors = {
    bigRise: ["rocketed up", "surged", "shot up", "stormed"],
    smallRise: ["climbed", "moved up", "advanced"],
    unchanged: ["held position", "stayed put"],
    smallFall: ["slipped", "dropped slightly"],
    bigFall: ["plummeted", "crashed", "tumbled"]
  };

  const formDescriptors = {
    improving: ["gaining momentum", "building form", "finding their stride"],
    declining: ["losing steam", "searching for form", "trying to bounce back"],
    stable: ["maintaining consistency", "showing stability"]
  };

  let performanceDesc = "";
  if (pointsVsAvg > 20) performanceDesc = performanceDescriptors.excellent[Math.floor(Math.random() * performanceDescriptors.excellent.length)];
  else if (pointsVsAvg > 10) performanceDesc = performanceDescriptors.good[Math.floor(Math.random() * performanceDescriptors.good.length)];
  else if (pointsVsAvg > -10) performanceDesc = performanceDescriptors.average[Math.floor(Math.random() * performanceDescriptors.average.length)];
  else if (pointsVsAvg > -20) performanceDesc = performanceDescriptors.poor[Math.floor(Math.random() * performanceDescriptors.poor.length)];
  else performanceDesc = performanceDescriptors.terrible[Math.floor(Math.random() * performanceDescriptors.terrible.length)];

  let rankDesc = "";
  if (rankChange > 3) rankDesc = rankChangeDescriptors.bigRise[Math.floor(Math.random() * rankChangeDescriptors.bigRise.length)];
  else if (rankChange > 0) rankDesc = rankChangeDescriptors.smallRise[Math.floor(Math.random() * rankChangeDescriptors.smallRise.length)];
  else if (rankChange === 0) rankDesc = rankChangeDescriptors.unchanged[Math.floor(Math.random() * rankChangeDescriptors.unchanged.length)];
  else if (rankChange > -3) rankDesc = rankChangeDescriptors.smallFall[Math.floor(Math.random() * rankChangeDescriptors.smallFall.length)];
  else rankDesc = rankChangeDescriptors.bigFall[Math.floor(Math.random() * rankChangeDescriptors.bigFall.length)];

  let formDesc = "";
  if (formTrend > 0) formDesc = formDescriptors.improving[Math.floor(Math.random() * formDescriptors.improving.length)];
  else if (formTrend < 0) formDesc = formDescriptors.declining[Math.floor(Math.random() * formDescriptors.declining.length)];
  else formDesc = formDescriptors.stable[Math.floor(Math.random() * formDescriptors.stable.length)];

  let narrative = `${performanceEmoji} ${performanceDesc} this week`;
  
  if (rankChange !== 0) {
    narrative += `, ${rankDesc} ${Math.abs(rankChange)} ${Math.abs(rankChange) === 1 ? 'place' : 'places'}`;
  }

  narrative += `, ${formDesc}`;

  if (currentPosition === 1) {
    narrative += ` ${positionEmoji} while leading the pack`;
  } else if (currentPosition <= 3) {
    narrative += ` ${positionEmoji} in the title race`;
  } else {
    narrative += ` ${positionEmoji}`;
  }

  return narrative.charAt(0).toUpperCase() + narrative.slice(1);
}

export async function fetchLeagueStandings(leagueId: number, gameweek: number): Promise<LeagueStanding[]> {
  const [leagueData, bootstrap] = await Promise.all([
    fetchLeagueDetails(leagueId, gameweek),
    fetchBootstrapData()
  ]);

  const teamData = await Promise.all(
    leagueData.standings.results.map(async team => ({
      history: await fetchTeamHistory(team.entry, gameweek),
      info: await fetchTeamInfo(team.entry)
    }))
  );

  const standings: LeagueStanding[] = leagueData.standings.results.map((standing, index) => {
    const teamHistory = teamData[index].history.current;
    const teamInfo = teamData[index].info;
    
    const totalPoints = teamHistory.length > 0 
      ? teamHistory[teamHistory.length - 1].total_points 
      : 0;

    const gwPoints = teamHistory.find(h => h.event === gameweek)?.points || 0;
    const gwTransferCost = teamHistory.find(h => h.event === gameweek)?.event_transfers_cost || 0;
    const eventTotal = gwPoints - gwTransferCost;
    
    // Get all gameweek history up to current gameweek for team spotlight
    const fullHistory = teamHistory
      .filter(gw => gw.event <= gameweek) // Only include gameweeks up to selected gameweek
      .map(gw => ({
        gameweek: gw.event,
        rank: gw.rank,
        total: gw.total_points,
        points: gw.points - gw.event_transfers_cost // Net points after transfer costs
      }))
      .sort((a, b) => a.gameweek - b.gameweek);

    // Get recent history (last 5 gameweeks) for league graph
    const recentHistory = [...fullHistory]
      .sort((a, b) => b.gameweek - a.gameweek)
      .slice(0, 5)
      .reverse();

    const allChips = [...(teamData[index].history.chips || []), ...(teamInfo.chips || [])];
    const processedChips = allChips
      .filter(chip => chip.event <= gameweek)
      .map(chip => ({
        name: normalizeChipName(chip.name.toLowerCase()),
        gameweek: chip.event,
        used: true
      }));

    const uniqueChips = processedChips.reduce((acc, curr) => {
      if (!acc.find(c => c.name === curr.name)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    return {
      entry_name: standing.entry_name,
      player_name: standing.player_name,
      rank: standing.rank,
      last_rank: standing.last_rank,
      total: totalPoints,
      entry: standing.entry,
      event_total: eventTotal,
      gameweek: gameweek,
      history: recentHistory,
      fullHistory: fullHistory,
      chips: uniqueChips
    };
  });

  return standings.sort((a, b) => b.total - a.total);
}

export function generateGameweekSummary(standings: LeagueStanding[]): GameweekSummary {
  if (!standings?.length) {
    throw new Error('No standings data available');
  }

  const currentGameweek = standings[0].gameweek;
  const rankChanges = calculateRankChanges(standings, currentGameweek);

  const topScorer = standings.reduce((prev, current) => 
    current.event_total > prev.event_total ? current : prev
  );

  const biggestRiser = rankChanges.reduce((prev, current) => 
    current.positionChange > prev.positionChange ? current : prev
  ).team;

  const biggestFaller = rankChanges.reduce((prev, current) => 
    current.positionChange < prev.positionChange ? current : prev
  ).team;

  const sortedByPoints = [...standings].sort((a, b) => b.total - a.total);
  const leader = sortedByPoints[0];
  const runnerUp = sortedByPoints[1];
  const pointGap = leader.total - runnerUp.total;

  const avgPoints = Math.round(
    standings.reduce((sum, team) => sum + team.event_total, 0) / standings.length
  );

  const teamsMovedUp = rankChanges.filter(({ positionChange }) => positionChange > 0).length;
  const teamsMovedDown = rankChanges.filter(({ positionChange }) => positionChange < 0).length;

  const keyEvents = [
    `📊 GW${standings[0].gameweek} saw an average score of ${avgPoints} points, with ${teamsMovedUp} teams climbing and ${teamsMovedDown} falling in rank`,

    pointGap > 20 ?
      `🏆 The title race sees ${leader.entry_name} commanding a ${pointGap}-point lead at the top` :
      pointGap > 10 ?
      `🏆 ${leader.entry_name} leads by ${pointGap} points, but the chasing pack remains in sight` :
      `🏆 Just ${pointGap} points separate the top teams in a thrilling title race`,

    teamsMovedUp + teamsMovedDown > standings.length / 2 ?
      `📈 A volatile week saw major changes throughout the table` :
      `⚖️ Many teams held their ground in a steady gameweek`,

    topScorer.event_total > avgPoints + 20 ?
      `🔥 An exceptional gameweek saw scores as high as ${topScorer.event_total} points` :
      topScorer.event_total > avgPoints + 10 ?
      `📈 Strong performances led to several scores above ${avgPoints + 10} points` :
      `📊 A challenging gameweek for most managers`
  ];

  const individualPerformances = standings.map(team => {
    const rankInfo = rankChanges.find(r => r.team.entry === team.entry)!;
    return {
      team,
      narrative: generateIndividualNarrative(
        team,
        avgPoints,
        standings.length,
        rankInfo.previousPosition,
        rankInfo.currentPosition
      )
    };
  });

  return {
    gameweek: standings[0].gameweek,
    standings: sortedByPoints,
    topScorer,
    biggestRiser,
    biggestFaller,
    rankChanges,
    narrative: {
      keyEvents,
      individualPerformances
    }
  };
}