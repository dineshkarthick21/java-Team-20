import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingTracker from '../components/BookingTracker';
import CustomAlert from '../components/CustomAlert';
import { generateBookingsPDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:8080/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  // Get logged in user from localStorage
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    // Fallback if not logged in
    return null;
  });

  // Track user status separately so it can be updated
  const [userStatus, setUserStatus] = useState(user?.status || 'ACTIVE');

  // Student's bookings - fetched from backend API
  const [bookings, setBookings] = useState([
    // Empty - user will create their own bookings
  ]);

  // Available resources - fetched from backend API
  const [resources, setResources] = useState([]);

  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    resourceId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  
  // Track approved/unavailable time slots
  const [allBookings, setAllBookings] = useState([]);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  
  // Approved bookings details modal
  const [showApprovedDetails, setShowApprovedDetails] = useState(false);
  const [approvedBookings, setApprovedBookings] = useState([]);
  
  // Track which bookings are expanded
  const [expandedBookings, setExpandedBookings] = useState({});
  
  // 15-minute auto-logout timer (900 seconds)
  const [timeRemaining, setTimeRemaining] = useState(900);
  
  // Alert state for CustomAlert component
  const [alertMessage, setAlertMessage] = useState({ message: '', type: 'info' });

  // Toggle booking details
  const toggleBookingDetails = (bookingId) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Download bookings as PDF
  const handleDownloadPDF = () => {
    if (bookings.length === 0) {
      setAlertMessage({ message: 'No bookings to download!', type: 'warning' });
      return;
    }
    
    const fileName = `my-bookings-${new Date().toISOString().split('T')[0]}.pdf`;
    generateBookingsPDF(bookings, fileName, {
      title: 'My Bookings',
      userName: user?.name || 'Student'
    });
    setAlertMessage({ message: 'PDF downloaded successfully!', type: 'success' });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch user status from backend
  const fetchUserStatus = async () => {
    try {
      // Try students collection first
      let response = await fetch(`${API_URL}/users/students/${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          setUserStatus(data.status);
          // Also update localStorage with full user data including department
          const updatedUser = { 
            ...user, 
            status: data.status,
            department: data.department || user.department,
            studentId: data.studentId || user.studentId
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
    fetchResources();
    fetchAllBookings();
    fetchUserStatus();
  }, []);
  
  // Update unavailable slots when resource or date changes
  useEffect(() => {
    if (newBooking.resourceId && newBooking.bookingDate) {
      checkUnavailableSlots();
    } else {
      setUnavailableSlots([]);
    }
  }, [newBooking.resourceId, newBooking.bookingDate, allBookings]);
  
  // Auto-logout timer - 15 minutes countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAlertMessage({ message: 'Session expired! You will be logged out.', type: 'warning' });
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch student's bookings from API
  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch available resources from API
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
  
  // Fetch all bookings to check availability
  const fetchAllBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      if (response.ok) {
        const data = await response.json();
        setAllBookings(data);
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error);
    }
  };
  
  // Check which time slots are unavailable for selected resource and date
  const checkUnavailableSlots = () => {
    const approvedBookings = allBookings.filter(
      (booking) =>
        booking.resourceId === newBooking.resourceId &&
        booking.bookingDate === newBooking.bookingDate &&
        (booking.status === 'APPROVED' || booking.status === 'STAFF_APPROVED' || booking.status === 'ADMIN_APPROVED')
    );
    
    const slots = approvedBookings.map((booking) => booking.timeSlot);
    setUnavailableSlots(slots);
  };
  
  // Check if a time slot is available
  const isSlotAvailable = (slot) => {
    return !unavailableSlots.includes(slot);
  };

  // Handle booking submission - Save to MongoDB Atlas via backend API
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    // Validate that end time is after start time
    if (newBooking.startTime && newBooking.endTime) {
      if (newBooking.endTime <= newBooking.startTime) {
        setAlertMessage({ message: 'End time must be after start time!', type: 'error' });
        return;
      }
    }
    
    // Combine start and end time into timeSlot format
    const timeSlot = `${newBooking.startTime} - ${newBooking.endTime}`;
    
    // Check if the selected time slot is unavailable (approved for another user)
    if (!isSlotAvailable(timeSlot)) {
      setAlertMessage({ message: 'Sorry! This resource has been approved for another user at this date and time slot.', type: 'warning' });
      return;
    }
    
    // Check if user already has a booking for the same resource, date, and time slot
    const duplicateBooking = bookings.find(
      (booking) =>
        booking.resourceId === newBooking.resourceId &&
        booking.bookingDate === newBooking.bookingDate &&
        booking.timeSlot === timeSlot &&
        booking.status !== 'REJECTED' // Allow reapplying if previous was rejected
    );

    if (duplicateBooking) {
      setAlertMessage({ message: 'Sorry! You have already applied for this resource at the same date and time slot.', type: 'warning' });
      return;
    }
    
    const bookingData = {
      userId: user.id,
      userRole: user.role,
      resourceId: newBooking.resourceId,
      bookingDate: newBooking.bookingDate,
      timeSlot: timeSlot,
      purpose: newBooking.purpose,
    };

    console.log('Sending booking data:', bookingData);
    console.log('User object:', user);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      console.log('Backend response:', result);

      if (response.ok && result.success) {
        setAlertMessage({ message: 'Booking created successfully! Waiting for staff approval.', type: 'success' });
        
        // Refresh bookings list
        fetchBookings();
        fetchAllBookings(); // Update availability
        fetchUserStatus(); // Update user status in case it was changed to INACTIVE
        
        // Reset form
        setNewBooking({
          resourceId: '',
          bookingDate: '',
          startTime: '',
          endTime: '',
          purpose: '',
        });
        setShowBookingForm(false);
      } else {
        console.error('Booking creation failed:', result);
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to create booking'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setAlertMessage({ message: 'Failed to create booking. Please ensure backend is running.', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
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
        setBookings(prev => prev.filter(b => b.id !== bookingId));
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
  
  // Fetch and show approved booking details
  const handleViewApprovedDetails = async () => {
    try {
      // Fetch ALL bookings from all users
      const response = await fetch(`${API_URL}/bookings`);
      if (response.ok) {
        const data = await response.json();
        // Filter only approved bookings from ALL users
        const approved = data.filter(
          (b) => b.status === 'STAFF_APPROVED' || b.status === 'ADMIN_APPROVED' || b.status === 'APPROVED'
        );
        setApprovedBookings(approved);
        setShowApprovedDetails(true);
      }
    } catch (error) {
      console.error('Error fetching approved bookings:', error);
      setAlertMessage({ message: 'Failed to fetch approved bookings', type: 'error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your profile and track your bookings</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Approved Details Button */}
          <button
            onClick={handleViewApprovedDetails}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Approve Details
          </button>
          {/* Auto-logout Timer */}
          <div className="flex flex-col items-end">
            <div className="bg-red-100 border-2 border-red-500 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-2xl font-bold text-red-600">{formatTime(timeRemaining)}</span>
              </div>
            </div>
            <span className="text-xs text-red-600 font-medium mt-1">Auto-logout timer</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            userStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {userStatus}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Student ID</p>
            <p className="text-lg font-semibold text-gray-900">{user.id}</p>
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
          <div>
            <p className="text-sm font-medium text-gray-500">Member Since</p>
            <p className="text-lg font-semibold text-gray-900">{user.createdAt}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Applied</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter((b) => b.status === 'APPLIED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Fully Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter((b) => b.status === 'ADMIN_APPROVED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter((b) => b.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Book a Resource Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Book a Resource</h2>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              showBookingForm
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showBookingForm ? 'Cancel' : '+ New Booking'}
          </button>
        </div>

        {showBookingForm && (
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resource Selection */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a resource...</option>
                  {resources.length === 0 ? (
                    <option disabled>No resources available. Contact admin.</option>
                  ) : (
                    resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} (Capacity: {resource.capacity})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Booking Date */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Time Slot - Custom Time Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Time Slot
                  {newBooking.resourceId && newBooking.bookingDate && unavailableSlots.length > 0 && (
                    <span className="text-xs text-red-600 ml-2">(Some time slots may be approved for other users)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-xs font-medium text-gray-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={newBooking.startTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-xs font-medium text-gray-600 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={newBooking.endTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {newBooking.startTime && newBooking.endTime && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected slot: <span className="font-semibold text-blue-600">{newBooking.startTime} - {newBooking.endTime}</span>
                  </p>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  id="purpose"
                  name="purpose"
                  value={newBooking.purpose}
                  onChange={handleInputChange}
                  placeholder="e.g., Programming Workshop"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Booking Request
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My Bookings Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {bookings.length === 0 ? (
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
          bookings.map((booking) => (
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
      
      {/* Approved Details Modal */}
      {showApprovedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">All Approved Bookings</h2>
              <button
                onClick={() => setShowApprovedDetails(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {approvedBookings.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Approved Bookings</h3>
                  <p className="text-gray-600">You don't have any approved bookings yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvedBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-bold text-lg">
                                  {booking.userName ? booking.userName.charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{booking.userName || 'Unknown User'}</div>
                                <div className="text-sm text-gray-500">{booking.userId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {booking.id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.resourceName}</div>
                            <div className="text-sm text-gray-500">{booking.resourceType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.bookingDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.timeSlot}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={booking.purpose}>
                              {booking.purpose}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'ADMIN_APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {booking.status === 'ADMIN_APPROVED' ? 'Fully Approved' : booking.status === 'APPROVED' ? 'Approved' : 'Staff Approved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Summary Card */}
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-green-900">Summary</h3>
                    </div>
                    <p className="text-sm text-green-800">
                      There are <span className="font-bold">{approvedBookings.length}</span> approved booking(s) in total. 
                      These resources are reserved at the specified dates and times.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowApprovedDetails(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CustomAlert Component */}
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

export default StudentDashboard;
