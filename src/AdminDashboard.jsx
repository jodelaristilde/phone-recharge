import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CheckCircle, Calendar, LogOut, Trash2, CheckSquare, Square, History, X, Users, UserPlus, Key, ChevronDown, ChevronUp, Clipboard } from 'lucide-react';
import { useAuth } from './AuthContext';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());
  const [showQR, setShowQR] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedHistoryDates, setExpandedHistoryDates] = useState({});
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  useEffect(() => {
    loadRequests();

    // Auto-refresh requests every 30 seconds to see updates from other admins
    const interval = setInterval(() => {
      loadRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      const data = await response.json();
      setRequests(data.requests || []);
      setCurrentDate(data.date || new Date().toLocaleDateString());
      setSelectedIds([]);
    } catch (error) {
      console.log('No existing requests found');
    }
  };

  const saveRequests = async (updatedRequests) => {
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: updatedRequests, date: currentDate })
      });
    } catch (error) {
      console.error('Error saving requests:', error);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleComplete = async (id) => {
    const updatedRequests = requests.map(req =>
      req.id === id ? { ...req, completed: !req.completed } : req
    );
    setRequests(updatedRequests);
    await saveRequests(updatedRequests);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map(req => req.id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmed = window.confirm(`Delete ${selectedIds.length} selected request(s)?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const updatedRequests = requests.filter(req => !selectedIds.includes(req.id));
      setRequests(updatedRequests);
      setSelectedIds([]);
      await saveRequests(updatedRequests);
    } catch (error) {
      console.error('Error deleting requests:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSold = requests.reduce((sum, req) => sum + (req.amount || 0), 0);
  const completedCount = requests.filter(req => req.completed).length;

  const getCustomerURL = () => {
    return 'https://www.zinpete.com/customer';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    loadHistory();
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleShowUsers = () => {
    setShowUsers(true);
    loadUsers();
  };

  const handleDeleteUser = async (username) => {
    const confirmed = window.confirm(`Are you sure you want to delete user "${username}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        // Reload users list
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setCreateSuccess('Account created successfully!');
        setNewUsername('');
        setNewPassword('');
        // Reload users list
        loadUsers();
        // Clear success message after 3 seconds
        setTimeout(() => {
          setCreateSuccess('');
        }, 3000);
      } else {
        setCreateError(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setCreateError('Failed to connect to server');
    } finally {
      setIsCreating(false);
    }
  };

  const handleShowResetPassword = (username) => {
    setResetUsername(username);
    setResetPassword('');
    setResetError('');
    setResetSuccess('');
    setShowResetPassword(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsResetting(true);

    try {
      const response = await fetch('/api/admin/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resetUsername, newPassword: resetPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess('Password updated successfully!');
        setResetPassword('');
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowResetPassword(false);
          setResetSuccess('');
        }, 2000);
      } else {
        setResetError(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setResetError('Failed to connect to server');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleHistoryEntry = (date) => {
    setExpandedHistoryDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-orange-400">Recharge Dashboard</h1>
              <p className="text-gray-300 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {currentDate}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </button>
              <button
                onClick={handleShowHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <History className="w-5 h-5" />
                History
              </button>
              <button
                onClick={handleShowUsers}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Users
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 border border-gray-600 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          {showQR && (
            <div className="mb-6 p-6 bg-gray-700 rounded-lg border-2 border-orange-600">
              <p className="text-sm font-semibold text-orange-400 mb-4 text-center">Customer QR Code</p>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCustomerURL())}`}
                    alt="Customer View QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-300 mb-2">Scan to submit a recharge request</p>
                  <p className="text-xs text-gray-400 font-mono bg-gray-800 px-3 py-1 rounded border border-gray-600 inline-block">
                    {getCustomerURL()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-sm text-orange-400 font-semibold mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-white">{requests.length}</p>
                </div>
                <div className="border-l border-r border-gray-600">
                  <p className="text-sm text-orange-400 font-semibold mb-1">Completed</p>
                  <p className="text-3xl font-bold text-white">{completedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-400 font-semibold mb-1">Total Sold</p>
                  <p className="text-3xl font-bold text-white">${totalSold.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4 border border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                {selectedIds.length === requests.length ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Select All
              </button>
              
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Selected ({selectedIds.length})
                </button>
              )}
              
              {selectedIds.length > 0 && (
                <span className="text-gray-300">
                  {selectedIds.length} item(s) selected
                </span>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b-2 border-orange-600">
                <tr>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-orange-400 w-16">Select</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      No requests yet today
                    </td>
                  </tr>
                ) : (
                  [...requests].reverse().map((req) => (
                    <tr 
                      key={req.id}
                      className={`border-b border-gray-700 transition-colors ${
                        req.completed 
                          ? 'bg-green-900 bg-opacity-30 hover:bg-opacity-40' 
                          : 'hover:bg-gray-700'
                      } ${selectedIds.includes(req.id) ? 'bg-orange-900 bg-opacity-20' : ''}`}
                    >
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleSelect(req.id)}
                          className="inline-flex items-center justify-center"
                        >
                          {selectedIds.includes(req.id) ? (
                            <CheckSquare className="w-6 h-6 text-orange-400" />
                          ) : (
                            <Square className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{req.timestamp}</td>
                      <td className="px-6 py-4 text-sm text-white">{req.name}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{req.phoneNumber}</span>
                          <button
                            onClick={() => handleCopy(req.phoneNumber, req.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {copiedId === req.id ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clipboard className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-400">${(req.amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {req.completed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-700 text-green-100 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-yellow-700 text-yellow-100 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleComplete(req.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            req.completed
                              ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          {req.completed ? 'Undo' : 'Mark Complete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
<h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Last 15 Days History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {isLoadingHistory ? (
                  <div className="text-center py-8 text-gray-400">Loading history...</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No history available yet</div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 rounded-lg border border-gray-600 hover:border-orange-600 transition-colors overflow-hidden"
                      >
                        {/* Clickable header - always visible */}
                        <button
                          onClick={() => toggleHistoryEntry(entry.date)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-650 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-white font-semibold text-lg flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-orange-400" />
                              {entry.date}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {entry.totalRequests || 0} request(s)
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-orange-400 font-semibold mb-1">Total Sold</p>
                              <p className="text-3xl font-bold text-white">
                                ${(entry.totalSold || 0).toFixed(2)}
                              </p>
                            </div>
                            {/* Expand/collapse icon */}
                            {expandedHistoryDates[entry.date] ? (
                              <ChevronUp className="w-6 h-6 text-orange-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Expanded content - individual requests table */}
                        {expandedHistoryDates[entry.date] && (
                          <div className="border-t border-gray-600 bg-gray-750">
                            {/* Check if individual requests are available */}
                            {entry.requests && entry.requests.length > 0 ? (
                              <div className="p-4">
                                <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Individual Requests
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-600">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-orange-400">Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-orange-400">Phone Number</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-orange-400">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-orange-400">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entry.requests.map((req) => (
                                        <tr
                                          key={req.id}
                                          className="border-b border-gray-600 hover:bg-gray-650 transition-colors"
                                        >
                                          <td className="px-4 py-3 text-sm text-gray-300">
                                            {req.timestamp}
                                          </td>
                                          <td className="px-4 py-3 text-sm font-medium text-white">
                                            {req.phoneNumber}
                                          </td>
                                          <td className="px-4 py-3 text-sm font-semibold text-orange-400">
                                            ${(req.amount || 0).toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3">
                                            {req.completed ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-700 text-green-100 rounded-full text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" />
                                                Complete
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center px-2 py-1 bg-yellow-700 text-yellow-100 rounded-full text-xs font-medium">
                                                Pending
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              /* Backward compatibility: no individual requests available */
                              <div className="p-8 text-center">
                                <p className="text-gray-400 text-sm">
                                  Individual requests not available for this date
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  (This entry was created before the individual requests feature)
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  User Management
                </h2>
                <button
                  onClick={() => setShowUsers(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {/* Create Account Form - Only visible to admin */}
                {currentUser === 'admin' && (
                  <div className="mb-6 bg-gray-700 rounded-lg p-6 border-2 border-purple-600">
                    <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Create New Account
                    </h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-purple-400 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Enter username (min 3 characters)"
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:border-purple-500 focus:outline-none"
                          disabled={isCreating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-400 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter password (min 6 characters)"
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:border-purple-500 focus:outline-none"
                          disabled={isCreating}
                        />
                      </div>

                      {createError && (
                        <div className="p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
                          <p className="text-center text-red-100 text-sm">{createError}</p>
                        </div>
                      )}

                      {createSuccess && (
                        <div className="p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg">
                          <p className="text-center text-green-100 text-sm">{createSuccess}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-5 h-5" />
                        {isCreating ? 'Creating Account...' : 'Create Account'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Users List */}
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Registered Users</h3>
                  {isLoadingUsers ? (
                    <div className="text-center py-8 text-gray-400">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No registered users yet</div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user, index) => (
                        <div
                          key={index}
                          className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-purple-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold text-lg">
                                {user.username}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Created: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {currentUser === 'admin' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleShowResetPassword(user.username)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                >
                                  <Key className="w-4 h-4" />
                                  Reset Password
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.username)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showResetPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  Reset Password
                </h2>
                <button
                  onClick={() => setShowResetPassword(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-400 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={resetUsername}
                      disabled
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:border-blue-500 focus:outline-none"
                      disabled={isResetting}
                      autoFocus
                    />
                  </div>

                  {resetError && (
                    <div className="p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
                      <p className="text-center text-red-100 text-sm">{resetError}</p>
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg">
                      <p className="text-center text-green-100 text-sm">{resetSuccess}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(false)}
                      className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Key className="w-5 h-5" />
                      {isResetting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;