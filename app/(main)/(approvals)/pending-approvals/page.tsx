'use client';

import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Eye,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Info,
  Grid3x3,
  Filter
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import TempoMetricCard from '@/components/dashboard/TempoMetricCard';
import { motion, AnimatePresence } from 'framer-motion';
import LordIcon, { LordIconRef } from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';

interface PendingChange {
  _id: string;
  changeType: string;
  status: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  description: string;
  changeData: any;
  targetCollection?: string;
  targetDatabase?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
}

interface Stats {
  total: {
    pending: number;
    approved: number;
    rejected: number;
  };
  byType: Array<{ _id: string; count: number }>;
  myPending: number;
}

export default function PendingApprovalsPage() {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date-latest' | 'date-oldest'>('date-latest');
  const searchIconRef = useRef<LordIconRef>(null);

  useEffect(() => {
    fetchPendingChanges();
    fetchStats();
  }, [filter]);

  const fetchPendingChanges = async () => {
    try {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/pending-changes${statusParam}`);
      const data = await response.json();

      if (data.success) {
        setPendingChanges(data.changes);
      } else {
        toast.error('Failed to fetch pending changes');
      }
    } catch (error) {
      toast.error('Error loading pending changes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/pending-changes/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      employee_registration: 'Employee Registration',
      employee_update: 'Employee Update',
      unit_registration: 'Unit Registration',
      unit_update: 'Unit Update',
      attendance_mark: 'Attendance Mark',
      bulk_upload: 'Bulk Upload'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-700',
        icon: Clock
      },
      approved: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-200 dark:border-green-700',
        icon: CheckCircle
      },
      rejected: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-200 dark:border-red-700',
        icon: XCircle
      }
    };

    const config = styles[status] || {
      bg: 'bg-slate-100 dark:bg-gray-700',
      text: 'text-slate-900 dark:text-slate-400',
      border: 'border-gray-200 dark:border-gray-600',
      icon: FileText
    };

    const IconComponent = config.icon;

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} flex items-center gap-1.5`}>
        <IconComponent className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Title - Left Side */}
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pending Approvals</h1>
          </div>

          {/* Search Box - Right Side */}
          <div
            className="relative w-64"
            onMouseEnter={() => searchIconRef.current?.playAnimation()}
            onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LordIcon
                ref={searchIconRef}
                icon={searchIcon}
                size={16}
                className="text-gray-400"
                trigger="manual"
              />
            </div>
            <input
              type="text"
              placeholder="Search approvals..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <TempoMetricCard
              icon={<Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              title="Pending"
              value={stats.total.pending}
              change="Requires Action"
              changeLabel="Total Pending"
              isPositive={true}
            />
            <TempoMetricCard
              icon={<CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              title="Approved"
              value={stats.total.approved}
              change="Completed"
              changeLabel="Total Approved"
              isPositive={true}
            />
            <TempoMetricCard
              icon={<XCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              title="Rejected"
              value={stats.total.rejected}
              change="Declined"
              changeLabel="Total Rejected"
              isPositive={false}
            />
            <TempoMetricCard
              icon={<FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              title="Total Requests"
              value={stats.total.pending + stats.total.approved + stats.total.rejected}
              change="All Time"
              changeLabel="Total Requests"
              isPositive={true}
            />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            {['pending', 'approved', 'rejected', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${filter === tab
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">More Filters</span>
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilters(false)}
                />

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Sort By</h3>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSortBy('date-latest');
                        setShowFilters(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${sortBy === 'date-latest'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <span>Date (Latest First)</span>
                      {sortBy === 'date-latest' && (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('date-oldest');
                        setShowFilters(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${sortBy === 'date-oldest'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <span>Date (Oldest First)</span>
                      {sortBy === 'date-oldest' && (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Changes List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Changes List
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              {pendingChanges.length} items
            </span>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : pendingChanges.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-900 dark:text-white font-medium mb-1">No changes found</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">No {filter !== 'all' ? filter : ''} changes are available at the moment</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...pendingChanges]
                  .sort((a, b) => {
                    // Sort by date based on sortBy state
                    const dateA = new Date(a.requestedAt).getTime();
                    const dateB = new Date(b.requestedAt).getTime();
                    return sortBy === 'date-latest' ? dateB - dateA : dateA - dateB;
                  })
                  .map((change) => (
                    <div
                      key={change._id}
                      className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {getChangeTypeLabel(change.changeType)}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>Requested by <span className="font-medium text-slate-700 dark:text-slate-300">{change.requestedBy}</span></span>
                                <span>•</span>
                                <span>{formatDate(change.requestedAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="ml-[52px]">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                              {change.description}
                            </p>

                            <div className="flex items-center gap-3">
                              {getStatusBadge(change.status)}

                              {change.status !== 'pending' && change.reviewedBy && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Reviewed by {change.reviewedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-[52px] sm:ml-0 pt-2 sm:pt-0">
                          {change.status === 'pending' ? (
                            <button
                              onClick={() => setSelectedChange(change)}
                              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedChange(change)}
                              className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        <AnimatePresence>
          {selectedChange && (
            <ReviewModal
              change={selectedChange}
              onClose={() => setSelectedChange(null)}
              onApprove={() => {
                fetchPendingChanges();
                fetchStats();
              }}
              onReject={() => {
                fetchPendingChanges();
                fetchStats();
              }}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Sub-component for Review Modal to isolate state and prevent focus loss
interface ReviewModalProps {
  change: PendingChange;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  getStatusBadge: (status: string) => JSX.Element;
  formatDate: (dateString: string) => string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  change,
  onClose,
  onApprove,
  onReject,
  getStatusBadge,
  formatDate
}) => {
  const [reviewComments, setReviewComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this change?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/pending-changes/${change._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: reviewComments })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Change approved successfully');
        setReviewComments('');
        onClose();
        onApprove();
      } else {
        toast.error(data.error || 'Failed to approve change');
      }
    } catch (error) {
      toast.error('Error approving change');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewComments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this change?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/pending-changes/${change._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: reviewComments })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Change rejected');
        setReviewComments('');
        onClose();
        onReject();
      } else {
        toast.error(data.error || 'Failed to reject change');
      }
    } catch (error) {
      toast.error('Error rejecting change');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Change</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">ID: {change._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Description */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Description</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{change.description}</p>
          </div>

          {/* Change Data */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Change Data
            </h3>
            <div className="bg-slate-900 rounded-xl p-4 overflow-hidden">
              <pre className="text-xs text-slate-300 font-mono overflow-x-auto custom-scrollbar">
                {JSON.stringify(change.changeData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Review Info for Processed Items */}
          {change.status !== 'pending' && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Review Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-400 block text-xs mb-1">Status</span>
                  {getStatusBadge(change.status)}
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400 block text-xs mb-1">Reviewed By</span>
                  <span className="text-slate-900 dark:text-white font-medium">{change.reviewedBy || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400 block text-xs mb-1">Reviewed At</span>
                  <span className="text-slate-900 dark:text-white font-medium">{change.reviewedAt ? formatDate(change.reviewedAt) : 'N/A'}</span>
                </div>
                {change.reviewComments && (
                  <div className="sm:col-span-2">
                    <span className="text-blue-700 dark:text-blue-400 block text-xs mb-1">Comments</span>
                    <p className="text-slate-900 dark:text-white bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      {change.reviewComments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Area for Pending Items */}
          {change.status === 'pending' && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Review Comments <span className="text-red-500">*</span> <span className="text-xs font-normal text-slate-500">(Required for rejection)</span>
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm"
                  rows={3}
                  placeholder="Add your comments here..."
                  disabled={processing}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};






















