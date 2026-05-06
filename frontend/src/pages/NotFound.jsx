import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h1 className="text-9xl font-black text-white/5 mb-4 select-none">404</h1>
        <h2 className="text-3xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex">
          <Home className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
