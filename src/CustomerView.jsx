import React, { useState } from 'react';
import { DollarSign, Phone } from 'lucide-react';

const CustomerView = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      const data = await response.json();
      return data.requests || [];
    } catch (error) {
      return [];
    }
  };

  const saveRequests = async (updatedRequests) => {
    const today = new Date().toLocaleDateString();
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: updatedRequests, date: today })
      });
    } catch (error) {
      console.error('Error saving requests:', error);
    }
  };

  const handleCustomerSubmit = async () => {
    if (!phoneNumber || !amount) {
      setStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      setStatus({ type: 'error', message: 'Phone number must be at least 10 digits' });
      return;
    }
    
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const existingRequests = await loadRequests();
      
      const newRequest = {
        id: Date.now(),
        phoneNumber,
        amount: parseFloat(amount),
        timestamp: new Date().toLocaleTimeString(),
        completed: false
      };

      const updatedRequests = [...existingRequests, newRequest];
      await saveRequests(updatedRequests);

      setPhoneNumber('');
      setAmount('');
      setStatus({ type: 'success', message: 'Request submitted successfully!' });
      
      setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to submit request. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 to-gray-900 p-4">
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
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
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Send Request'}
            </button>
          </div>

          {status.message && (
            <div className={"mt-6 p-4 rounded-lg border " + (status.type === 'success'
              ? 'bg-green-900 bg-opacity-50 border-green-600 text-green-100'
              : 'bg-red-900 bg-opacity-50 border-red-600 text-red-100')}>
              <p className="text-center font-medium">{status.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerView;