import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Trophy,
  Medal,
  Award,
  ThumbsUp,
  FileCheck,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leaderboard');
        if (res.success && res.data) {
          setLeaders(res.data);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shadow-xs border border-amber-300">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs border border-slate-300">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm shadow-xs border border-amber-200">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      <div className="text-center max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2 border border-amber-200">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Department Recognition</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Contributor Leaderboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Honoring students and scholars who dedicate time to share notes, solve past papers, and help peers succeed
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : leaders.length > 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Rank & Contributor
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Department & Sem
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    Materials
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    Helpful Upvotes
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Badges & Honors
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {leaders.map((leader) => (
                  <tr key={leader._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {getRankBadge(leader.rank)}
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{leader.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{leader.role}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{leader.department}</div>
                      <div className="text-[11px] text-slate-500">Semester {leader.semester}</div>
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        {leader.resourceCount}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        <ThumbsUp className="w-3.5 h-3.5 fill-blue-600" />
                        {leader.totalUpvotes}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {leader.badges?.map((badge, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No Contributors Ranked Yet"
          description="Start contributing lecture slides or revision notes to claim your spot on the department leaderboard."
        />
      )}
    </div>
  );
};

export default Leaderboard;

