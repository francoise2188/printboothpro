'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [photoLimit, setPhotoLimit] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventStatus, setEventStatus] = useState('not_started');

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsPageLoading(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventName(event.name || '');
    const eventDateTime = new Date(event.date);
    const formattedDate = eventDateTime.toISOString().slice(0, 16);
    setEventDate(formattedDate);
    setPhotoLimit(event.photo_limit?.toString() || '');
    setEventStatus(event.status || 'not_started');
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (data.success) {
          setEvents(events.filter(event => event.id !== eventId));
        } else {
          setError('Failed to delete event');
        }
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Raw form values:', {
        eventDate,
        endDate,
        timezone
      });

      const formatDateForDB = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toISOString().replace('T', ' ').replace('Z', '+00');
      };

      const formData = {
        eventName,
        eventDate: formatDateForDB(eventDate),
        endDate: formatDateForDB(endDate),
        photoLimit: parseInt(photoLimit) || 0,
        status: eventStatus,
        timezone
      };

      console.log('Sending to API:', formData);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        await fetchEvents();
        resetForm();
        showSuccess('Event created successfully');
      } else {
        setError(result.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEventName('');
    setEventDate('');
    setEndDate('');
    setPhotoLimit('');
    setTimezone('America/Chicago');
    setEditingEvent(null);
  };

  const formatDate = (dateString, timezone) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    setIsStatusUpdating(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchEvents();
        showSuccess('Status updated successfully');
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const router = useRouter();

  const handleViewDetails = (eventId) => {
    router.push(`/admin/events/${eventId}`);
  };

  const [endDate, setEndDate] = useState('');

  const [timezone, setTimezone] = useState('America/Chicago');

  const TIMEZONES = [
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' }
  ];

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Add template functionality
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const saveAsTemplate = async () => {
    // Save current event settings as a template
    const templateData = {
      name: eventName,
      photoLimit,
      status: eventStatus,
      // Add other relevant fields
    };
    // Save to database
  };

  const loadTemplate = (template) => {
    // Load template data into form
    setEventName(template.name);
    setPhotoLimit(template.photoLimit);
    setEventStatus(template.status);
    // Set other fields
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Events Management</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 transition-opacity duration-500">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event Name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Photo Limit</label>
            <input
              type="number"
              value={photoLimit}
              onChange={(e) => setPhotoLimit(e.target.value)}
              placeholder="Photo Limit"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time Zone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
            </button>

            {editingEvent && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events..."
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
          <span>Event List</span>
          <span className="text-sm font-normal text-gray-500">
            {sortedEvents.length} events found
          </span>
        </h2>

        {isPageLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedEvents.length > 0 ? (
          <ul className="space-y-4">
            {sortedEvents.map(event => (
              <li key={event.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{event.name}</h3>
                      <div className="space-y-1">
                        <p className="text-gray-500 text-sm">
                          {formatDate(event.date, event.timezone)} ({event.timezone})
                        </p>
                        <p className="text-gray-600 text-sm">
                          Photo Limit: {event.photo_limit || 0}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={event.status}
                          onChange={(e) => handleStatusChange(event.id, e.target.value)}
                          className={`text-sm rounded-full px-3 py-1 ${statusColors[event.status]} border-0`}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleViewDetails(event.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No events found</p>
        )}
      </div>
    </div>
  );
}