import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../components/CustomAlert';
import { generateBookingsPDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:8080/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [alertMessage, setAlertMessage] = useState({ message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('resources'); // 'resources', 'bookings', or 'students'
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('APPLIED');
  const [studentFilter, setStudentFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE'
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [newResource, setNewResource] = useState({
    name: '',
    type: 'LAB',
    capacity: '',
  });

  useEffect(() => {
    fetchBookings();
    fetchResources();
    fetchStudents();
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
  
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/users/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };
  
  const updateStudentStatus = async (studentId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/users/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAlertMessage({ message: `Student ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`, type: 'success' });
        fetchStudents();
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to update student status'), type: 'error' });
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      setAlertMessage({ message: 'Failed to update student status', type: 'error' });
    }
  };

  const unblockStudent = async (studentId) => {
    try {
      const response = await fetch(`${API_URL}/users/students/${studentId}/unblock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAlertMessage({ message: 'Student account unblocked successfully! Login attempts have been reset.', type: 'success' });
        fetchStudents();
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to unblock student'), type: 'error' });
      }
    } catch (error) {
      console.error('Error unblocking student:', error);
      setAlertMessage({ message: 'Failed to unblock student', type: 'error' });
    }
  };

  // Download bookings as PDF
  const handleDownloadBookingsPDF = () => {
    if (bookings.length === 0) {
      setAlertMessage({ message: 'No bookings to download!', type: 'warning' });
      return;
    }
    
    const fileName = `all-bookings-${new Date().toISOString().split('T')[0]}.pdf`;
    generateBookingsPDF(bookings, fileName, {
      title: 'All Bookings Report',
      userName: user?.name || 'Admin'
    });
    setAlertMessage({ message: 'PDF downloaded successfully!', type: 'success' });
  };

  const handleResourceInputChange = (e) => {
    const { name, value } = e.target;
    setNewResource(prev => ({ ...prev, [name]: value }));
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    
    const resourceData = {
      name: newResource.name,
      type: newResource.type,
      capacity: parseInt(newResource.capacity),
      status: 'AVAILABLE',
    };

    try {
      const response = await fetch(`${API_URL}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAlertMessage({ message: 'Resource added successfully!', type: 'success' });
        fetchResources();
        setNewResource({ name: '', type: 'LAB', capacity: '' });
        setShowResourceForm(false);
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to add resource'), type: 'error' });
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      setAlertMessage({ message: 'Failed to add resource.', type: 'error' });
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const response = await fetch(`${API_URL}/resources/${resourceId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAlertMessage({ message: 'Resource deleted successfully!', type: 'success' });
        fetchResources();
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to delete resource'), type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      setAlertMessage({ message: 'Failed to delete resource', type: 'error' });
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/admin-approve`, {
        method: 'PATCH',
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAlertMessage({ message: 'Booking approved successfully!', type: 'success' });
        fetchBookings();
      } else {
        setAlertMessage({ message: 'Error: ' + (result.message || 'Failed to approve booking'), type: 'error' });
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      setAlertMessage({ message: 'Failed to approve booking', type: 'error' });
    }
  };

  const handleRejectBooking = (bookingId) => {
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage resources and approve bookings</p>
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
            {user?.status || 'ACTIVE'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Admin ID</p>
            <p className="text-lg font-semibold text-gray-900">{user?.studentId || user?.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Full Name</p>
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email Address</p>
            <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Phone Number</p>
            <p className="text-lg font-semibold text-gray-900">{user?.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Department</p>
            <p className="text-lg font-semibold text-gray-900">{user?.department || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-lg font-semibold text-gray-900">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'resources'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resource Management
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Booking Approvals
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Student Management
          </button>
        </nav>
      </div>

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Campus Resources</h2>
            <button
              onClick={() => setShowResourceForm(!showResourceForm)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {showResourceForm ? 'Cancel' : '+ Add Resource'}
            </button>
          </div>

          {/* Add Resource Form */}
          {showResourceForm && (
            <form onSubmit={handleAddResource} className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newResource.name}
                    onChange={handleResourceInputChange}
                    placeholder="e.g., CSE Lab, Bhumi Lab"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={newResource.type}
                    onChange={handleResourceInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LAB">Lab</option>
                    <option value="CLASSROOM">Classroom</option>
                    <option value="EVENT_HALL">Event Hall</option>
                    <option value="COMPUTER">Computer</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={newResource.capacity}
                    onChange={handleResourceInputChange}
                    placeholder="e.g., 50"
                    min="1"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Add Resource
                </button>
              </div>
            </form>
          )}

          {/* Resources List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
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
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No resources found. Add your first resource to get started.
                    </td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{resource.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{resource.capacity} people</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          resource.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {resource.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          <div className="mb-6 flex gap-4 items-center justify-between">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="APPLIED">Applied</option>
              <option value="STAFF_APPROVED">Staff Approved</option>
              <option value="ALL">All Bookings</option>
              <option value="ADMIN_APPROVED">Admin Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              onClick={handleDownloadBookingsPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Applied</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {bookings.filter(b => b.status === 'APPLIED').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Staff Approved</p>
              <p className="text-2xl font-semibold text-blue-600">
                {bookings.filter(b => b.status === 'STAFF_APPROVED').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Admin Approved</p>
              <p className="text-2xl font-semibold text-green-600">
                {bookings.filter(b => b.status === 'ADMIN_APPROVED').length}
              </p>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.userName || booking.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.resourceName || booking.resourceId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.bookingDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.timeSlot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {booking.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(booking.status === 'APPLIED' || booking.status === 'STAFF_APPROVED') && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveBooking(booking.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectBooking(booking.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {booking.status !== 'APPLIED' && booking.status !== 'STAFF_APPROVED' && (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Management Tab */}
      {activeTab === 'students' && (
        <div>
          <div className="mb-6 flex gap-4">
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Students</option>
              <option value="ACTIVE">Active Students</option>
              <option value="INACTIVE">Inactive Students</option>
              <option value="BLOCKED">Blocked Students</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-green-600">
                {students.filter(s => s.status === 'ACTIVE' && !s.isBlocked).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-red-600">
                {students.filter(s => s.status === 'INACTIVE' && !s.isBlocked).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-500">Blocked</p>
              <p className="text-2xl font-semibold text-orange-600">
                {students.filter(s => s.isBlocked).length}
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Student Account Policies</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>Booking Limit:</strong> Students can book maximum <strong>2 resources per day</strong>. Account becomes INACTIVE after limit.</p>
                  <p className="mt-1"><strong>Login Security:</strong> Account gets <strong>BLOCKED</strong> after <strong>3 failed login attempts</strong>. Admin can unblock.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Student Accounts</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students
                  .filter(student => {
                    if (studentFilter === 'ALL') return true;
                    if (studentFilter === 'BLOCKED') return student.isBlocked;
                    return student.status === studentFilter && !student.isBlocked;
                  })
                  .length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students
                    .filter(student => {
                      if (studentFilter === 'ALL') return true;
                      if (studentFilter === 'BLOCKED') return student.isBlocked;
                      return student.status === studentFilter && !student.isBlocked;
                    })
                    .map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.studentId || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.department || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            student.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : student.status === 'INACTIVE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.isBlocked ? (
                            <div className="flex flex-col gap-1">
                              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                🔒 BLOCKED
                              </span>
                              <span className="text-xs text-gray-500">
                                {student.loginAttempts || 0} failed attempts
                              </span>
                            </div>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✓ OK
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {student.isBlocked ? (
                            <button
                              onClick={() => unblockStudent(student.id)}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              Unblock
                            </button>
                          ) : student.status === 'INACTIVE' ? (
                            <button
                              onClick={() => updateStudentStatus(student.id, 'ACTIVE')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStudentStatus(student.id, 'INACTIVE')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
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

export default AdminDashboard;
