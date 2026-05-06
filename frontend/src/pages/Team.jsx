import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../services';
import Avatar from '../components/ui/Avatar';
import { Mail, Shield, Calendar, Search } from 'lucide-react';
import { SkeletonCard } from '../components/ui/Skeleton';
import { format } from 'date-fns';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await authService.getUsers();
        setUsers(data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-900">Team Directory</h1>
          <p className="text-light-500">View all members in your organization</p>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="input pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user, i) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="card flex flex-col items-center text-center group"
            >
              <Avatar 
                name={user.name} 
                avatar={user.avatar} 
                size="xl" 
                className="mb-4 shadow-glow-sm group-hover:shadow-glow transition-shadow"
              />
              
              <h3 className="text-lg font-bold text-light-900">{user.name}</h3>
              <p className="text-sm text-light-500 mb-4">{user.email}</p>

              <div className="w-full flex items-center justify-between text-xs text-light-500 bg-white/[0.02] p-3 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className={user.role === 'admin' ? 'text-brand-400' : 'text-gray-500'} />
                  <span className="capitalize">{user.role}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-500" />
                  <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center glass rounded-2xl">
            <Search className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-light-900 mb-2">No members found</h3>
            <p className="text-gray-400">No one matches your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
