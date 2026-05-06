import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, ListTodo, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { taskService, activityService } from '../services';
import { SkeletonStat } from '../components/ui/Skeleton';
import Avatar from '../components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          taskService.getStats(),
          activityService.getAll({ limit: 5 })
        ]);
        setStats(statsRes.data.stats);
        setChartData(statsRes.data.weeklyData);
        setActivities(activitiesRes.data.activities);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: 'Total Tasks', value: stats?.total || 0, icon: ListTodo, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { title: 'Completed', value: stats?.completed || 0, icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
    { title: 'In Progress', value: stats?.inProgress || 0, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Overdue', value: stats?.overdue || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonStat key={i} />)
          : statCards.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stat-card"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-surface-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-surface-900 mt-1">{stat.value}</p>
                </div>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">Productivity Overview</h3>
            <span className="text-sm text-surface-500">Last 7 days completed tasks</span>
          </div>
          <div className="h-72">
            {!loading && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c3ef7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6c3ef7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="_id" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#111827' }}
                    itemStyle={{ color: '#111827' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6c3ef7" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {loading ? 'Loading chart...' : 'Not enough data to display chart'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6 shadow-card flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-brand-400" />
            <h3 className="section-title">Recent Activity</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-dark-600" />
                  <div className="flex-1">
                    <div className="h-3 bg-dark-600 rounded w-full mb-2" />
                    <div className="h-2 bg-dark-600 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  <Avatar name={activity.user?.name} avatar={activity.user?.avatar} size="sm" />
                  <div>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-surface-900">{activity.user?.name}</span>{' '}
                      {activity.message.replace(activity.user?.name || '', '')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
