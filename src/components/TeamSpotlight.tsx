import React from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { LeagueStanding } from '../types/fpl';

interface TeamSpotlightProps {
  team: LeagueStanding;
}

function generateSpotlightTitle(team: LeagueStanding): string {
  const rankChange = team.last_rank - team.rank;
  const isBottomHalf = team.rank > Math.floor(team.total / 2);
  
  if (rankChange > 2) return "🚀 Rocket to the Top";
  if (rankChange > 0) return "📈 Steady Climber";
  if (rankChange < -2 && isBottomHalf) return "🆘 Red Alert";
  if (rankChange < -2) return "📉 Fighting for Form";
  if (team.rank === 1) return "👑 Leading the Pack";
  if (team.rank <= 3) return "🏆 Title Contender";
  if (isBottomHalf && rankChange < 0) return "⚠️ Danger Zone";
  if (isBottomHalf) return "💪 Looking to Bounce Back";
  return "⚔️ Mid-table Warrior";
}

function generatePerformanceDescription(team: LeagueStanding): string {
  const history = team.history;
  const bestGw = Math.max(...history.map(h => h.total));
  const worstGw = Math.min(...history.map(h => h.total));
  const avgPoints = Math.round(history.reduce((sum, gw) => sum + gw.total, 0) / history.length);
  
  return `${team.entry_name} has shown ${
    team.event_total > avgPoints ? 'impressive' : 'challenging'
  } form lately. Their best gameweek saw them rack up ${bestGw} points, while their toughest week brought in ${worstGw}. Currently sitting at rank ${team.rank}, they're ${
    team.rank < team.last_rank ? 'climbing up' : 'looking to bounce back'
  } in the standings.`;
}

export function TeamSpotlight({ team }: TeamSpotlightProps) {
  const title = generateSpotlightTitle(team);
  const description = generatePerformanceDescription(team);
  const rankChange = team.last_rank - team.rank;

  return (
    <div className="stat-card rounded-xl p-6 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center space-x-3 mb-4">
        <div className="stat-icon icon-purple">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Team Spotlight</h3>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-2xl font-bold text-[#37003c] mb-2">{team.entry_name}</h4>
          <p className="text-xl font-semibold text-emerald-600">{title}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="stat-card p-3 flex-1">
            <p className="text-sm text-gray-600 mb-1">Current Rank</p>
            <p className="text-lg font-bold text-[#37003c]">{team.rank}</p>
          </div>
          <div className="stat-card p-3 flex-1">
            <p className="text-sm text-gray-600 mb-1">GW Points</p>
            <p className="text-lg font-bold text-emerald-600">{team.event_total}</p>
          </div>
          <div className="stat-card p-3 flex-1">
            <p className="text-sm text-gray-600 mb-1">Rank Change</p>
            <div className="flex items-center space-x-1">
              {rankChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <p className={`text-lg font-bold ${rankChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Math.abs(rankChange)}
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed">{description}</p>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Total Points:</span>
          <span className="font-bold text-[#37003c]">{team.total}</span>
        </div>
      </div>
    </div>
  );
}