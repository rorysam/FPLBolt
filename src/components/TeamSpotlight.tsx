import React from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { LeagueStanding } from '../types/fpl';

interface TeamSpotlightProps {
  team: LeagueStanding;
  standings: LeagueStanding[];
}

function generateSpotlightTitle(team: LeagueStanding, standings: LeagueStanding[]): string {
  const rankChange = team.last_rank - team.rank;
  const totalTeams = standings.length;
  const isTopThree = team.rank <= 3;
  const isTopHalf = team.rank <= Math.ceil(totalTeams / 2);
  const isBottomThree = team.rank > totalTeams - 3;
  const position = Math.ceil((team.rank / totalTeams) * 100);
  const analysis = analyzeSeasonPerformance(team, standings);

  // Dynamic titles based on multiple factors
  if (team.rank === 1) {
    if (rankChange > 0) return analysis.recentTrend === 'improving' ? "👑 The New King Arrives!" : "👑 Seizing the Crown!";
    return analysis.consistency === 'high' ? "👑 Dominant Force" : "👑 Holding the Throne";
  }

  if (isTopThree) {
    if (rankChange > 2) return "⚡ Thunderous Rise to Glory";
    if (rankChange > 0) return "🌟 Championship Challenger";
    if (rankChange < 0) return "🏃 Hot on the Leader's Heels";
    return "🏆 Elite Contender";
  }

  // Top half specific titles with form consideration
  if (isTopHalf) {
    if (position <= 25) {
      if (analysis.recentTrend === 'improving') return "🚀 Rocketing to the Top";
      if (rankChange > 2) return "⚡ Lightning Strike";
      if (rankChange > 0) return "🎯 Top Spot in Sight";
      return "💫 Top Quarter Dynamo";
    }
    
    if (analysis.recentTrend === 'improving') {
      if (rankChange > 2) return "🌠 Shooting Star";
      return "📈 Rising Phoenix";
    }
    if (rankChange > 2) return "⚔️ Warrior's Charge";
    if (rankChange > 0) return "🎭 Plot Twist";
    return "🛡️ Mid-table Maestro";
  }

  // Bottom half with dramatic flair
  if (position <= 75) {
    if (analysis.recentTrend === 'improving') {
      if (rankChange > 2) return "🌋 Volcanic Surge";
      return "💫 Rising from the Ashes";
    }
    if (rankChange > 2) return "⚡ Electric Comeback";
    if (rankChange > 0) return "🌅 Dawn of Recovery";
    return "⚔️ Battle-Hardened";
  }

  if (isBottomThree) {
    if (analysis.recentTrend === 'improving') {
      if (rankChange > 2) return "🌈 Miracle in Motion";
      return "💫 Defying the Odds";
    }
    if (rankChange > 2) return "🔥 Phoenix Rising";
    if (rankChange > 0) return "⚔️ Fighting Spirit";
    return "🌋 Ready to Erupt";
  }

  // Rest of bottom half with hope
  if (analysis.recentTrend === 'improving') {
    if (rankChange > 2) return "🌟 Destiny's Child";
    return "🎭 Plot Twist Incoming";
  }
  if (rankChange > 2) return "🚀 Launch Sequence";
  if (rankChange > 0) return "💫 Signs of Life";
  return "⚔️ The Comeback Story";
}

function analyzeSeasonPerformance(team: LeagueStanding, standings: LeagueStanding[]): {
  bestGw: number;
  worstGw: number;
  avgPoints: number;
  recentTrend: 'improving' | 'declining' | 'mixed';
  consistency: 'high' | 'medium' | 'low';
  highestRank: number;
  lowestRank: number;
  recentPoints: number[];
} {
  const history = team.fullHistory;
  
  // Calculate best and worst gameweek points
  const bestGw = Math.max(...history.map(gw => gw.points));
  const worstGw = Math.min(...history.map(gw => gw.points));
  
  // Calculate average points per gameweek
  const avgPoints = Math.round(history.reduce((sum, gw) => sum + gw.points, 0) / history.length);

  // Calculate league ranks for each gameweek using full history
  const gameweekRanks = history.map(currentGw => {
    const gwStandings = standings
      .map(team => {
        const gwHistory = team.fullHistory.find(h => h.gameweek === currentGw.gameweek);
        return {
          entry: team.entry,
          total: gwHistory?.total || 0
        };
      })
      .sort((a, b) => b.total - a.total);

    return gwStandings.findIndex(s => s.entry === team.entry) + 1;
  });
  
  const highestRank = Math.min(...gameweekRanks);
  const lowestRank = Math.max(...gameweekRanks);
  
  // Get previous 3 gameweeks before the current gameweek
  const currentGameweek = team.gameweek;
  const recentPoints = history
    .filter(gw => gw.gameweek < currentGameweek)
    .sort((a, b) => b.gameweek - a.gameweek)
    .slice(0, 3)
    .reverse()
    .map(gw => gw.points);
  
  // Analyze recent trend using the previous 3 gameweeks
  let improvements = 0;
  let declines = 0;
  
  for (let i = 1; i < recentPoints.length; i++) {
    if (recentPoints[i] > recentPoints[i - 1]) improvements++;
    if (recentPoints[i] < recentPoints[i - 1]) declines++;
  }
  
  const recentTrend = improvements > declines ? 'improving' : 
                      declines > improvements ? 'declining' : 'mixed';
  
  // Analyze consistency using all gameweeks
  const pointsStdDev = Math.sqrt(
    history.reduce((sum, gw) => sum + Math.pow(gw.points - avgPoints, 2), 0) / history.length
  );
  
  const consistency = pointsStdDev < 10 ? 'high' : 
                     pointsStdDev < 20 ? 'medium' : 'low';
  
  return {
    bestGw,
    worstGw,
    avgPoints,
    recentTrend,
    consistency,
    highestRank,
    lowestRank,
    recentPoints
  };
}

function generatePerformanceDescription(team: LeagueStanding, standings: LeagueStanding[]): string {
  const seasonAnalysis = analyzeSeasonPerformance(team, standings);
  const rankChange = team.last_rank - team.rank;
  
  // Dynamic performance descriptors
  const currentPerformance = team.event_total >= 70 ? ["unleashed a masterclass", "dominated the gameweek", "showed pure brilliance"] :
                            team.event_total >= 60 ? ["lit up the gameweek", "delivered a stellar performance", "showed championship form"] :
                            team.event_total >= 50 ? ["impressed the critics", "showed their class", "delivered the goods"] :
                            team.event_total >= 40 ? ["put in a solid shift", "kept their hopes alive", "showed glimpses of form"] :
                            team.event_total >= 30 ? ["battled through adversity", "weathered the storm", "fought for every point"] :
                            ["endured a challenging week", "faced tough decisions", "looked for answers"];

  // Dramatic rank movement phrases
  const rankMovement = rankChange > 3 ? `storming up ${rankChange} places in a spectacular climb` :
                      rankChange > 0 ? `surging ${rankChange} places up the rankings` :
                      rankChange < -3 ? `slipping ${Math.abs(rankChange)} places in a dramatic turn` :
                      rankChange < 0 ? `dropping ${Math.abs(rankChange)} spots` :
                      "holding firm in their position";

  // Recent form analysis with flair
  const formPhrase = seasonAnalysis.recentTrend === 'improving' ? 
    `Their form is reaching new heights, with each gameweek better than the last` :
    seasonAnalysis.recentTrend === 'declining' ? 
    `They're looking to rediscover their magic after recent setbacks` :
    `They've been mixing brilliant moments with challenging spells`;

  // Season journey narrative
  const journeyPhrase = `This season has seen them scale the heights of ${seasonAnalysis.highestRank}${getOrdinalSuffix(seasonAnalysis.highestRank)} place${
    seasonAnalysis.lowestRank > seasonAnalysis.highestRank ? 
    `, showing true grit to bounce back from ${seasonAnalysis.lowestRank}${getOrdinalSuffix(seasonAnalysis.lowestRank)}` : 
    " and maintain their impressive standards"
  }`;

  // Future outlook based on current position
  const outlookPhrase = team.rank <= 3 ? 
    "Every point could be golden in their quest for glory" :
    team.rank <= 5 ? 
    "The summit is within reach if they can maintain this momentum" :
    team.rank <= Math.ceil(standings.length / 2) ? 
    "The stage is set for a dramatic push up the rankings" :
    "The comeback story is waiting to be written";

  // Construct the epic narrative
  return `${team.entry_name} ${currentPerformance[Math.floor(Math.random() * currentPerformance.length)]}, amassing ${team.event_total} points and ${rankMovement}. ${
    seasonAnalysis.recentPoints.length >= 2 ? 
    `Their journey through the last three gameweeks (${seasonAnalysis.recentPoints.join(', ')} points) tells a tale of ${
      seasonAnalysis.consistency === 'high' ? "remarkable consistency" :
      seasonAnalysis.consistency === 'medium' ? "growing potential" :
      "dramatic swings"
    }. ` : ''
  }${formPhrase}. Their season peak of ${seasonAnalysis.bestGw} points shows their true potential${
    seasonAnalysis.worstGw < seasonAnalysis.bestGw ? 
    `, while their low of ${seasonAnalysis.worstGw} points proves they can overcome any challenge` : 
    " and what they're capable of"
  }. ${journeyPhrase}. ${outlookPhrase}.`;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function TeamSpotlight({ team, standings }: TeamSpotlightProps) {
  const title = generateSpotlightTitle(team, standings);
  const description = generatePerformanceDescription(team, standings);
  const rankChange = team.last_rank - team.rank;
  const seasonAnalysis = analyzeSeasonPerformance(team, standings);

  return (
    <div className="stat-card rounded-xl p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center space-x-3 mb-4">
        <div className="stat-icon icon-purple">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Team Spotlight</h3>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xl sm:text-2xl font-bold text-[#37003c] mb-2 line-clamp-1">{team.entry_name}</h4>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600">{title}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="stat-card p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Current Rank</p>
            <p className="text-base sm:text-lg font-bold text-[#37003c]">{team.rank}</p>
          </div>
          <div className="stat-card p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">GW Points</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">{team.event_total}</p>
          </div>
          <div className="stat-card p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Rank Change</p>
            <div className="flex items-center space-x-1">
              {rankChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <p className={`text-base sm:text-lg font-bold ${rankChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Math.abs(rankChange)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{description}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
            <div className="stat-card p-2">
              <p className="text-gray-500">Best GW</p>
              <p className="font-semibold text-emerald-600">{seasonAnalysis.bestGw} pts</p>
            </div>
            <div className="stat-card p-2">
              <p className="text-gray-500">Average</p>
              <p className="font-semibold text-[#37003c]">{seasonAnalysis.avgPoints} pts</p>
            </div>
            <div className="stat-card p-2">
              <p className="text-gray-500">Highest Rank</p>
              <p className="font-semibold text-emerald-600">#{seasonAnalysis.highestRank}</p>
            </div>
            <div className="stat-card p-2">
              <p className="text-gray-500">Consistency</p>
              <p className="font-semibold text-[#37003c] capitalize">{seasonAnalysis.consistency}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
          <span>Total Points:</span>
          <span className="font-bold text-[#37003c]">{team.total}</span>
        </div>
      </div>
    </div>
  );
}