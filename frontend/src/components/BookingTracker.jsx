import React from 'react';

const BookingTracker = ({ status, bookingDate, approvedDate, rejectionReason }) => {
  // Determine the current step based on status
  const getStepStatus = () => {
    const steps = {
      APPLIED: { current: 1, rejected: false },
      STAFF_APPROVED: { current: 2, rejected: false },
      ADMIN_APPROVED: { current: 3, rejected: false },
      REJECTED: { current: 1, rejected: true },
      // Legacy support
      PENDING: { current: 1, rejected: false },
      APPROVED: { current: 3, rejected: false },
    };
    return steps[status] || { current: 1, rejected: false };
  };

  const { current, rejected } = getStepStatus();

  // Steps configuration
  const steps = [
    {
      id: 1,
      label: 'APPLIED',
      description: 'Booking Submitted',
      date: bookingDate,
      icon: '📝',
    },
    {
      id: 2,
      label: 'STAFF APPROVED',
      description: 'Staff Reviewed',
      date: null,
      icon: '👤',
    },
    {
      id: 3,
      label: 'ADMIN APPROVED',
      description: 'Booking Confirmed',
      date: approvedDate,
      icon: '✅',
    },
  ];

  // Get color class based on step status
  const getStepColor = (stepId) => {
    if (rejected) {
      return stepId === current ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-300 border-gray-300 text-gray-500';
    }
    if (stepId <= current) {
      return 'bg-green-600 border-green-600 text-white';
    }
    return 'bg-gray-300 border-gray-300 text-gray-500';
  };

  const getLineColor = (stepId) => {
    if (rejected) {
      return stepId < current ? 'bg-green-600' : 'bg-gray-300';
    }
    if (stepId < current) {
      return 'bg-green-600';
    }
    return 'bg-gray-300';
  };

  // Status message
  const getStatusMessage = () => {
    if (rejected) {
      return {
        text: 'Booking Rejected',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
      };
    }
    switch (status) {
      case 'APPLIED':
      case 'PENDING':
        return {
          text: 'Booking submitted. Awaiting staff review.',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
        };
      case 'STAFF_APPROVED':
        return {
          text: 'Staff approved. Pending admin approval.',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
        };
      case 'ADMIN_APPROVED':
      case 'APPROVED':
        return {
          text: 'Booking confirmed! Your resource is ready.',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
        };
      default:
        return {
          text: 'Processing your booking request...',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const statusMsg = getStatusMessage();

  return (
    <div className="bg-gray-50 rounded-xl p-6 mt-4">
      {/* Status Header - More Prominent */}
      <div className={`${statusMsg.bgColor} border-l-4 ${rejected ? 'border-red-600' : status === 'ADMIN_APPROVED' || status === 'APPROVED' ? 'border-green-600' : 'border-blue-600'} p-4 rounded-r-lg mb-6 flex items-center shadow-sm`}>
        <div className="mr-3">
          {rejected ? (
            <div className="bg-red-600 rounded-full p-1.5">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          ) : status === 'ADMIN_APPROVED' || status === 'APPROVED' ? (
            <div className="bg-green-600 rounded-full p-1.5">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="bg-blue-600 rounded-full p-1.5">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <p className={`font-bold text-lg ${statusMsg.color}`}>{statusMsg.text}</p>
        </div>
      </div>

      {/* Progress Tracker - Enhanced */}
      <div className="relative">
        <div className="flex justify-between items-start">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              {/* Step Container */}
              <div className="flex flex-col items-center">
                {/* Circle - Larger and More Prominent */}
                <div
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl transition-all duration-500 transform ${
                    getStepColor(step.id)
                  } ${step.id === current ? 'scale-110 shadow-xl' : 'scale-100 shadow-md'} z-10 relative`}
                >
                  {step.id <= current ? (
                    rejected && step.id === current ? (
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <span className="text-2xl">{step.icon}</span>
                  )}
                </div>

                {/* Label - Better Typography */}
                <div className="text-center mt-5">
                  <p
                    className={`font-bold text-base uppercase tracking-wide ${
                      step.id <= current
                        ? rejected && step.id === current
                          ? 'text-red-700'
                          : 'text-green-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">{step.description}</p>
                  {step.date && (
                    <p className="text-xs text-gray-500 mt-1.5 font-mono bg-white px-2 py-1 rounded inline-block">{step.date}</p>
                  )}
                </div>
              </div>

              {/* Connecting Line - Thicker and More Visible */}
              {index < steps.length - 1 && (
                <div className="absolute top-10 left-1/2 w-full h-2 -z-0">
                  <div className="h-full bg-gray-300 relative overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all duration-700 ease-in-out ${getLineColor(
                        step.id
                      )} rounded-full`}
                      style={{
                        width: step.id < current ? '100%' : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info - Cleaner Design */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 mr-2">Current Status:</span>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${rejected ? 'bg-red-100 text-red-800' : status === 'ADMIN_APPROVED' || status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-5">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-600 mr-2 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            {rejected && (
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-600 mr-2 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">Rejected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingTracker;
