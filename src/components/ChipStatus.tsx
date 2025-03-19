import React from 'react';
import { LeagueStanding } from '../types/fpl';
import { Zap } from 'lucide-react';

interface ChipStatusProps {
  standings: LeagueStanding[];
}

export function ChipStatus({ standings }: ChipStatusProps) {
  const chipTypes = ['wildcard', 'freehit', 'bench_boost', 'triple_captain'];
  const chipNames = {
    wildcard: '🃏 Wildcard',
    freehit: '🔄 Free Hit',
    bench_boost: '🔋 Bench Boost',
    triple_captain: '👑 Triple Captain'
  };

  const chipColors = {
    wildcard: {
      bg: 'bg-violet-100',
      text: 'text-violet-800',
      border: 'border-violet-200',
      hover: 'hover:bg-violet-50'
    },
    freehit: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-50'
    },
    bench_boost: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-800',
      border: 'border-cyan-200',
      hover: 'hover:bg-cyan-50'
    },
    triple_captain: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      hover: 'hover:bg-amber-50'
    }
  };

  return (
    <div className="stat-card rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="stat-icon icon-purple">
          <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Chip Status</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Team</th>
              {chipTypes.map(chip => (
                <th key={chip} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  {chipNames[chip]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {standings.map((team) => (
              <tr key={team.entry} className="table-row">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {team.entry_name}
                </td>
                {chipTypes.map(chip => {
                  const chipInfo = team.chips?.find(c => c.name === chip);
                  const colors = chipColors[chip];
                  return (
                    <td key={chip} className="px-4 py-3 text-center">
                      {chipInfo?.used ? (
                        <span className={`text-xs ${colors.bg} ${colors.text} py-1 px-2 rounded-full border ${colors.border} font-medium`}>
                          GW {chipInfo.gameweek}
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-50 text-emerald-700 py-1 px-2 rounded-full border border-emerald-200 font-medium transition-colors hover:bg-emerald-100">
                          Available
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}