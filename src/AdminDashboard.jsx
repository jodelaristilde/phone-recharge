import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CheckCircle, Calendar, LogOut, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuth } from './AuthContext';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());
  const [showQR, setShowQR] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    loadRequests();
    
    const checkDailyReset = async () => {
      const today = new Date().toLocaleDateString();
      if (currentDate !== today) {
        setRequests([]);
        setSelectedIds([]);
        setCurrentDate(today);
        try {
          await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [], date: today })
          });
        } catch (error) {
          console.log('Daily reset completed');
        }
      }
    };
    
    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

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

  const totalSold = requests.reduce((sum, req) => sum + req.amount, 0);
  const completedCount = requests.filter(req => req.completed).length;

  const getCustomerURL = () => {
    const baseURL = window.location.href.split('?')[0].replace('/admin/dashboard', '').replace('/admin', '');
    return baseURL;
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
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
                      <td className="px-6 py-4 text-sm font-medium text-white">{req.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-400">${req.amount.toFixed(2)}</td>
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
      </div>
    </div>
  );
};

export default AdminDashboard;