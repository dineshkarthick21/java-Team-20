import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../components/CustomAlert';
import BookingTracker from '../components/BookingTracker';
import { generateBookingsPDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:8080/api';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [alertMessage, setAlertMessage] = useState({ message: '', type: 'info' });
  
  // Tab management
  const [activeTab, setActiveTab] = useState('review'); // 'review' or 'my-bookings'
  
  // Review bookings state
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('APPLIED');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // My bookings state (staff's own bookings)
  const [myBookings, setMyBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    resourceId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  
  // Track which bookings are expanded
  const [expandedBookings, setExpandedBookings] = useState({});

  useEffect(() => {
    fetchBookings();
    fetchMyBookings();
    fetchResources();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      let url = `${API_URL}/bookings`;
      if (filterStatus !== 'ALL') {
        url = `${API_URL}/bookings/status/${filterStatus}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };
  
  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMyBookings(data);
      }
    } catch (error) {
      console.error('Error fetching my bookings:', error);
    }
  };
  
  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_URL}/resources`);
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    if (newBooking.endTime <= newBooking.startTime) {
      setAlertMessage({ message: 'End time must be after start time!', type: 'error' });
      return;
    }
    
    const timeSlot = `${newBooking.startTime} - ${newBooking.endTime}`;
    
    const bookingData = {
      userId: user.id,
      userRole: user.role,
      resourceId: newBooking.resourceId,
      bookingDate: newBooking.bookingDate,
      timeSlot: timeSlot,
      purpose: newBooking.purpose,
    };

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAlertMessage({ message: 'Booking created successfully! Waiting for admin approval.', type: 'success' });
        fetchMyBookings();
        setNewBooking({
          resourceId: '',
          bookingDate: '',
          startTime: '',
          endTime: '',
          purpose: '',
        });
        setShowBookingForm(false);
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to create booking'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setAlertMessage({ message: 'Failed to create booking.', type: 'error' });
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/staff-approve`, {
        method: 'PATCH',
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAlertMessage({ message: 'Booking approved! Forwarded to Admin for final approval.', type: 'success' });
        fetchBookings();
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to approve booking'), type: 'error' });
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      setAlertMessage({ message: 'Failed to approve booking', type: 'error' });
    }
  };

  const handleReject = (bookingId) => {
    setSelectedBookingId(bookingId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      setAlertMessage({ message: 'Please provide a reason for rejection', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bookings/${selectedBookingId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason }),
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAlertMessage({ message: 'Booking rejected.', type: 'success' });
        setShowRejectModal(false);
        setRejectionReason('');
        fetchBookings();
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to reject booking'), type: 'error' });
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setAlertMessage({ message: 'Failed to reject booking', type: 'error' });
    }
  };
  
  const toggleBookingDetails = (bookingId) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Download review bookings as PDF
  const handleDownloadReviewPDF = () => {
    if (bookings.length === 0) {
      setAlertMessage({ message: 'No bookings to download!', type: 'warning' });
      return;
    }
    
    const fileName = `review-bookings-${new Date().toISOString().split('T')[0]}.pdf`;
    generateBookingsPDF(bookings, fileName, {
      title: 'Booking Review List',
      userName: user?.name || 'Staff'
    });
    setAlertMessage({ message: 'PDF downloaded successfully!', type: 'success' });
  };

  // Download my bookings as PDF
  const handleDownloadMyBookingsPDF = () => {
    if (myBookings.length === 0) {
      setAlertMessage({ message: 'No bookings to download!', type: 'warning' });
      return;
    }
    
    const fileName = `my-bookings-${new Date().toISOString().split('T')[0]}.pdf`;
    generateBookingsPDF(myBookings, fileName, {
      title: 'My Bookings',
      userName: user?.name || 'Staff'
    });
    setAlertMessage({ message: 'PDF downloaded successfully!', type: 'success' });
  };
  
  // Delete booking
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setMyBookings(prev => prev.filter(b => b.id !== bookingId));
        setAlertMessage({ message: 'Booking deleted successfully!', type: 'success' });
      } else {
        const result = await response.json();
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to delete booking'), type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      setAlertMessage({ message: 'Failed to delete booking. Please ensure backend is running.', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'STAFF_APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'ADMIN_APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {activeTab === 'review' ? 'Review and approve student booking requests' : 'Manage your resource bookings'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          Logout
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            {user.status || 'ACTIVE'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Employee ID</p>
            <p className="text-lg font-semibold text-gray-900">{user.studentId || user.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Full Name</p>
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email Address</p>
            <p className="text-lg font-semibold text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Phone Number</p>
            <p className="text-lg font-semibold text-gray-900">{user.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Department</p>
            <p className="text-lg font-semibold text-gray-900">{user.department || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-lg font-semibold text-gray-900">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('review')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Review Bookings
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-bookings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Bookings
          </button>
        </nav>
      </div>

      {/* Review Bookings Tab */}
      {activeTab === 'review' && (
        <div>
          {/* Filter */}
          <div className="mb-6 flex gap-4 items-center justify-between">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="APPLIED">Applied (Pending Review)</option>
              <option value="ALL">All Bookings</option>
              <option value="STAFF_APPROVED">Staff Approved</option>
              <option value="ADMIN_APPROVED">Admin Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              onClick={handleDownloadReviewPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Bookings</p>
          <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Pending Review</p>
          <p className="text-2xl font-semibold text-yellow-600">
            {bookings.filter(b => b.status === 'APPLIED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Approved by Me</p>
          <p className="text-2xl font-semibold text-blue-600">
            {bookings.filter(b => b.status === 'STAFF_APPROVED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Fully Approved</p>
          <p className="text-2xl font-semibold text-green-600">
            {bookings.filter(b => b.status === 'ADMIN_APPROVED').length}
          </p>
        </div>
      </div>

      {/* Booking Requests Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Booking Requests</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Slot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No booking requests found.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.userName || booking.userId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.resourceName || booking.resourceId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{booking.bookingDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{booking.timeSlot}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{booking.purpose}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {booking.status === 'APPLIED' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Flow Tracker */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Approval Flow</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">Student Applies</p>
            <p className="text-xs text-gray-500">APPLIED</p>
          </div>
          <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">Staff Review</p>
            <p className="text-xs text-gray-500">STAFF_APPROVED</p>
          </div>
          <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">Admin Approval</p>
            <p className="text-xs text-gray-500">ADMIN_APPROVED</p>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* My Bookings Tab */}
      {activeTab === 'my-bookings' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">My Resource Bookings</h2>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadMyBookingsPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {showBookingForm ? 'Cancel' : '+ New Booking'}
              </button>
            </div>
          </div>

          {/* Booking Form */}
          {showBookingForm && (
            <form onSubmit={handleSubmitBooking} className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Resource
                  </label>
                  <select
                    id="resourceId"
                    name="resourceId"
                    value={newBooking.resourceId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a resource...</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} - {resource.type} (Capacity: {resource.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    id="bookingDate"
                    name="bookingDate"
                    value={newBooking.bookingDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={newBooking.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={newBooking.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    value={newBooking.purpose}
                    onChange={handleInputChange}
                    placeholder="Briefly describe the purpose of booking..."
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Submit Booking Request
                </button>
              </div>
            </form>
          )}

          {/* My Bookings List */}
          <div className="space-y-6">
            {myBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                <div className="flex justify-center mb-4">
                  <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-600 mb-4">Click the "+ New Booking" button above to create your first booking request.</p>
              </div>
            ) : (
              myBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  
                  {/* Header Bar with Resource Info */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="bg-white bg-opacity-20 rounded-lg p-2">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{booking.resourceName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white bg-opacity-25 text-white">
                              {booking.resourceType}
                            </span>
                            <span className="text-xs text-blue-100 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                              {booking.capacity} people
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-blue-100 mb-1">Booking ID</div>
                        <div 
                          className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-opacity-30 transition-all group relative"
                          onClick={() => {
                            navigator.clipboard.writeText(booking.id);
                            setAlertMessage({ message: 'Booking ID copied to clipboard!', type: 'success' });
                          }}
                          title="Click to copy"
                        >
                          <span className="text-sm font-mono font-semibold text-white">
                            #{booking.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="px-6 py-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2.5">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{booking.bookingDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 bg-green-100 rounded-lg p-2.5">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time Slot</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{booking.timeSlot}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2.5">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purpose</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{booking.purpose}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Status Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          booking.status === 'ADMIN_APPROVED' || booking.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Delete Button - Only show for REJECTED, APPROVED, or ADMIN_APPROVED */}
                        {(booking.status === 'REJECTED' || booking.status === 'APPROVED' || booking.status === 'ADMIN_APPROVED') && (
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                            title="Delete booking"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
                        
                        {/* More Details Button */}
                        <button
                          onClick={() => toggleBookingDetails(booking.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                        >
                          <span>{expandedBookings[booking.id] ? 'Hide Details' : 'More Details'}</span>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-300 ${expandedBookings[booking.id] ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Details Section */}
                  {expandedBookings[booking.id] && (
                    <div className="border-t border-gray-200 bg-white">
                  {/* Rejection Reason - Improved Design */}
                  {booking.status === 'REJECTED' && booking.rejectionReason && (
                    <div className="mx-6 mt-5 mb-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="bg-red-500 rounded-full p-1.5">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-bold text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-800 leading-relaxed">{booking.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracker */}
                  <div className="px-6 pb-6">
                    <BookingTracker
                      status={booking.status}
                      bookingDate={booking.createdAt}
                      approvedDate={booking.approvedDate}
                      rejectionReason={booking.rejectionReason}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reject Booking</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this booking request:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="4"
              placeholder="Enter rejection reason..."
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={submitRejection}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Submit Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {alertMessage.message && (
        <CustomAlert 
          message={alertMessage.message} 
          type={alertMessage.type}
          onClose={() => setAlertMessage({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
