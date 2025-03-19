import React from 'react';
import { Trophy, TrendingUp, TrendingDown, ScrollText, Share2, Users, Medal } from 'lucide-react';
import { GameweekSummary } from '../types/fpl';
import { LeagueGraph } from './LeagueGraph';
import { TeamSpotlight } from './TeamSpotlight';
import { ChipStatus } from './ChipStatus';

interface DebriefSummaryProps {
  summary: GameweekSummary;
}

export function DebriefSummary({ summary }: DebriefSummaryProps) {
  const spotlightCandidates = summary.standings.filter(team => 
    team !== summary.topScorer && 
    team !== summary.biggestRiser && 
    team !== summary.biggestFaller
  );
  const spotlightTeam = spotlightCandidates[Math.floor(Math.random() * spotlightCandidates.length)];

  const generateWhatsAppMessage = () => {
    return `🏆 *FPL Gameweek ${summary.gameweek} Summary*\n\n` +
           `📈 *Top Scorer:* ${summary.topScorer.entry_name} (${summary.topScorer.event_total} pts)\n\n` +
           `⬆️ *Biggest Riser:* ${summary.biggestRiser.entry_name} (${summary.rankChanges.find(r => r.team.entry === summary.biggestRiser.entry)?.previousPosition} ➡️ ${summary.rankChanges.find(r => r.team.entry === summary.biggestRiser.entry)?.currentPosition})\n\n` +
           `⬇️ *Biggest Faller:* ${summary.biggestFaller.entry_name} (${summary.rankChanges.find(r => r.team.entry === summary.biggestFaller.entry)?.previousPosition} ➡️ ${summary.rankChanges.find(r => r.team.entry === summary.biggestFaller.entry)?.currentPosition})\n\n` +
           `*Current Top 3:*\n${summary.standings.slice(0, 3).map((s, i) => 
             `${i + 1}. ${s.entry_name} - ${s.total} pts`
           ).join('\n')}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
  };

  const getRankChangeInfo = (team: typeof summary.biggestRiser) => {
    const rankInfo = summary.rankChanges.find(r => r.team.entry === team.entry);
    return rankInfo ? `${rankInfo.previousPosition} → ${rankInfo.currentPosition}` : '';
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return "";
    }
  };

  const getPointsColorClass = (points: number) => {
    const scores = summary.standings.map(s => s.event_total);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const range = max - min;
    const normalizedScore = (points - min) / range;
    
    // Poor performance (bottom 25%)
    if (points < avg - (range * 0.25)) {
      return 'bg-red-100 text-red-700';
    }
    // Below average (25-45%)
    if (points < avg - (range * 0.05)) {
      return 'bg-orange-100 text-orange-700';
    }
    // Average (45-55%)
    if (points <= avg + (range * 0.05)) {
      return 'bg-yellow-100 text-yellow-700';
    }
    // Above average (55-75%)
    if (points < avg + (range * 0.25)) {
      return 'bg-lime-100 text-lime-700';
    }
    // Excellent performance (top 25%)
    return 'bg-emerald-100 text-emerald-700';
  };

  const ColorScale = () => (
    <div className="flex items-center space-x-2 text-xs">
      <div className="flex items-center space-x-1">
        <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></span>
        <span className="text-gray-600">Poor</span>
      </div>
      <span className="text-gray-400">•</span>
      <div className="flex items-center space-x-1">
        <span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></span>
        <span className="text-gray-600">Average</span>
      </div>
      <span className="text-gray-400">•</span>
      <div className="flex items-center space-x-1">
        <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></span>
        <span className="text-gray-600">Excellent</span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="stat-icon icon-purple">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Top Scorer</h3>
          </div>
          <div className="flex flex-col justify-between h-[88px]">
            <p className="text-2xl font-bold text-gray-900">{summary.topScorer.entry_name}</p>
            <p className="text-[#37003c] font-bold text-xl">{summary.topScorer.event_total} points</p>
          </div>
        </div>

        <div className="stat-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="stat-icon icon-green">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Biggest Riser</h3>
          </div>
          <div className="flex flex-col justify-between h-[88px]">
            <p className="text-2xl font-bold text-gray-900">{summary.biggestRiser.entry_name}</p>
            <p className="text-emerald-600 font-bold text-xl">
              {getRankChangeInfo(summary.biggestRiser)}
            </p>
          </div>
        </div>

        <div className="stat-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="stat-icon icon-red">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Biggest Faller</h3>
          </div>
          <div className="flex flex-col justify-between h-[88px]">
            <p className="text-2xl font-bold text-gray-900">{summary.biggestFaller.entry_name}</p>
            <p className="text-red-600 font-bold text-xl">
              {getRankChangeInfo(summary.biggestFaller)}
            </p>
          </div>
        </div>

        <div className="stat-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="stat-icon icon-purple">
              <Medal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Top 3</h3>
          </div>
          <div className="flex flex-col justify-between h-[88px]">
            {summary.standings.slice(0, 3).map((team, index) => (
              <div key={team.entry} className="flex items-center space-x-2">
                <span className="text-lg w-6">{getMedalEmoji(index)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate text-sm">
                    {team.entry_name}
                  </p>
                  <p className="text-xs text-gray-500 italic truncate">
                    {team.player_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="stat-icon icon-purple">
            <ScrollText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Gameweek {summary.gameweek} Narrative</h3>
        </div>
        <ul className="space-y-4">
          {summary.narrative.keyEvents.map((event, index) => (
            <li key={index} className="text-gray-700 text-lg flex items-start space-x-2">
              <span className="text-[#37003c] mt-1">•</span>
              <span>{event}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="stat-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="stat-icon icon-purple">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Team Updates</h3>
          </div>
          <ColorScale />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {summary.standings.map((team, index) => {
            const performance = summary.narrative.individualPerformances.find(p => p.team.entry === team.entry);
            return (
              <div 
                key={team.entry} 
                className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-[#37003c] text-xs truncate flex-1">
                    {team.entry_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${getPointsColorClass(team.event_total)}`}>
                      {team.event_total}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 italic truncate mb-1">
                  {team.player_name}
                </span>
                <p className="text-xs text-gray-600 line-clamp-2 leading-snug">
                  {performance?.narrative}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {spotlightTeam && <TeamSpotlight team={spotlightTeam} standings={summary.standings} />}

      <div className="stat-card rounded-xl p-6">
        <LeagueGraph standings={summary.standings} />
      </div>

      <ChipStatus standings={summary.standings} />

      <div className="stat-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Gameweek {summary.gameweek} Standings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Team</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">GW</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.standings.map((standing, index) => (
                <tr key={standing.entry} className="table-row">
                  <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{standing.entry_name}</span>
                      <span className="text-xs text-gray-500 italic">{standing.player_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-600 text-right font-medium">{standing.event_total}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">{standing.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={copyToClipboard}
        className="w-full py-4 bg-[#37003c] text-white font-bold rounded-xl hover:bg-[#240028] transition-colors flex items-center justify-center space-x-2"
      >
        <Share2 className="w-5 h-5" />
        <span>Share on WhatsApp</span>
      </button>
    </div>
  );
}