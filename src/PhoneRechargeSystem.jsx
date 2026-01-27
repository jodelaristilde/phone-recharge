import React, { useState, useEffect } from 'react';
import { QrCode, DollarSign, Phone, CheckCircle, Calendar, Download } from 'lucide-react';

const PhoneRechargeSystem = () => {
  const [view, setView] = useState('admin'); // 'customer' or 'admin'
  const [requests, setRequests] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [showQR, setShowQR] = useState(false);
  const [showAdminHint, setShowAdminHint] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);

  // Load requests from storage on mount and check URL parameters
  useEffect(() => {
    loadRequests();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'customer') {
      setView('customer');
    }
  }, []);

  // Check for daily reset
  useEffect(() => {
    const checkDailyReset = async () => {
      const today = new Date().toLocaleDateString('en-GB');
      if (currentDate !== today) {
        setRequests([]);
        setCurrentDate(today);
        try {
          await window.storage.set('recharge-requests', JSON.stringify({
            requests: [],
            date: today
          }), true);
        } catch (error) {
          console.log('Daily reset completed');
        }
      }
    };

    checkDailyReset();
    // Check every minute for date change
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const loadRequests = async () => {
    try {
      const result = await window.storage.get('recharge-requests', true);
      if (result && result.value) {
        const data = JSON.parse(result.value);
        setRequests(data.requests || []);
        setCurrentDate(data.date || new Date().toLocaleDateString('en-GB'));
      }
    } catch (error) {
      console.log('No existing requests found');
    }
  };

  const saveRequests = async (updatedRequests) => {
    try {
      await window.storage.set('recharge-requests', JSON.stringify({
        requests: updatedRequests,
        date: currentDate
      }), true);
    } catch (error) {
      console.error('Error saving requests:', error);
    }
  };

  const handleCustomerSubmit = async () => {
    if (!phoneNumber || !amount) {
      alert('Please fill in all fields');
      return;
    }

    // Remove all non-digit characters to count actual digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
      alert('Phone number must be at least 10 digits');
      return;
    }

    const newRequest = {
      id: Date.now(),
      phoneNumber,
      amount: parseFloat(amount),
      timestamp: new Date().toLocaleTimeString(),
      completed: false
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);
    await saveRequests(updatedRequests);

    setPhoneNumber('');
    setAmount('');
    alert('Request submitted successfully! ✓');
  };

  const handleMouseEnter = () => {
    const timer = setTimeout(() => {
      setShowAdminHint(true);
    }, 5000);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowAdminHint(false);
  };

  const toggleComplete = async (id) => {
    const updatedRequests = requests.map(req =>
      req.id === id ? { ...req, completed: !req.completed } : req
    );
    setRequests(updatedRequests);
    await saveRequests(updatedRequests);
  };

  const totalSold = requests.reduce((sum, req) => sum + req.amount, 0);
  const completedCount = requests.filter(req => req.completed).length;

  const getCustomerURL = () => {
    const baseURL = window.location.href.split('?')[0];
    return `${baseURL}?view=customer`;
  };

  // Customer View
  if (view === 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-gray-900 p-4">
        <div className="max-w-md mx-auto mt-8">
          <div
            className="bg-gray-800 rounded-2xl shadow-xl p-8"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-full mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-orange-400 mb-2">Zin Pété</h1>
              <p className="text-gray-300">Add minutes to your phone</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-orange-400 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-orange-500 focus:outline-none text-lg placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-400 mb-2">
                  Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-orange-500 focus:outline-none text-lg placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                onClick={handleCustomerSubmit}
                className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors shadow-lg"
              >
                Send Request
              </button>
            </div>

            {showAdminHint && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setView('admin')}
                  className="w-full px-4 py-2 bg-gray-700 text-orange-400 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium border border-orange-600"
                >
                  Access Admin Dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin View
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
                onClick={() => setView('customer')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 border border-gray-600"
              >
                Customer View
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

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b-2 border-orange-600">
                <tr>
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
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
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
                      }`}
                    >
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

export default PhoneRechargeSystem;
