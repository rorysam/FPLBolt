import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LeagueStanding } from '../types/fpl';
import { Eye, EyeOff } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LeagueGraphProps {
  standings: LeagueStanding[];
}

const COLORS = [
  '#37003c',
  '#059669',
  '#dc2626',
  '#2563eb',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#0891b2',
];

export function LeagueGraph({ standings }: LeagueGraphProps) {
  const [visibleTeams, setVisibleTeams] = useState<Set<number>>(
    new Set(standings.map(team => team.entry))
  );

  const toggleTeam = (teamId: number) => {
    const newVisibleTeams = new Set(visibleTeams);
    if (newVisibleTeams.has(teamId)) {
      if (newVisibleTeams.size > 1) {
        newVisibleTeams.delete(teamId);
      }
    } else {
      newVisibleTeams.add(teamId);
    }
    setVisibleTeams(newVisibleTeams);
  };

  const allGameweeks = Array.from(
    new Set(standings.flatMap(s => s.history.map(h => h.gameweek)))
  ).sort((a, b) => a - b);

  const gameweeks = allGameweeks.slice(-5);

  const leagueHistory = gameweeks.map(gw => {
    const gwStandings = standings.map(team => {
      const gwHistory = team.history.find(h => h.gameweek === gw);
      return {
        entry: team.entry,
        entry_name: team.entry_name,
        total: gwHistory?.total || 0
      };
    });

    gwStandings.sort((a, b) => b.total - a.total);

    return gwStandings.map((team, index) => ({
      ...team,
      rank: index + 1
    }));
  });

  const data = {
    labels: gameweeks.map(gw => `GW ${gw}`),
    datasets: standings
      .filter(team => visibleTeams.has(team.entry))
      .map((team, index) => {
        const teamHistory = gameweeks.map(gw => {
          const gwPosition = leagueHistory[gameweeks.indexOf(gw)]
            .find(t => t.entry === team.entry)?.rank || 0;
          return gwPosition;
        });

        return {
          label: team.entry_name,
          data: teamHistory,
          borderColor: COLORS[index % COLORS.length],
          backgroundColor: COLORS[index % COLORS.length] + '20',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        };
      }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        reverse: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#64748b',
          stepSize: 1,
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'League Position',
          color: '#334155',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'Recent Gameweeks',
          color: '#334155',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Recent League Position History',
        color: '#334155',
        font: {
          size: 14,
          weight: 'bold',
        },
        padding: {
          bottom: 16,
        },
      },
      tooltip: {
        mode: 'nearest',
        intersect: true,
        callbacks: {
          title: (context: any) => context[0].label,
          label: (context: any) => {
            const team = standings[context.datasetIndex];
            const gw = team.history.find(h => h.gameweek === gameweeks[context.dataIndex]);
            return `${team.entry_name}: Position ${context.raw} (${gw?.total} pts)`;
          },
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#37003c',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      intersect: true,
    },
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {standings.map((team, index) => (
          <button
            key={team.entry}
            onClick={() => toggleTeam(team.entry)}
            className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-all ${
              visibleTeams.has(team.entry)
                ? 'bg-gray-100 hover:bg-gray-200'
                : 'bg-gray-50 hover:bg-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs sm:text-sm font-medium truncate">
                {team.entry_name}
              </span>
            </div>
            {visibleTeams.has(team.entry) ? (
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
      <div className="h-[300px] sm:h-[400px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}