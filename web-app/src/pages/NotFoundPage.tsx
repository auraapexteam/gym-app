import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center bg-grid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-aura-primary/10 flex items-center justify-center mx-auto mb-6">
          <Zap className="h-8 w-8 text-aura-primary/60" />
        </div>
        <h1 className="text-7xl font-black text-aura-primary mb-4">404</h1>
        <h2 className="text-xl font-bold text-aura-text mb-2">Page not found</h2>
        <p className="text-aura-muted mb-8 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-aura-primary text-aura-bg font-semibold px-6 py-2.5 rounded-md hover:bg-aura-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
