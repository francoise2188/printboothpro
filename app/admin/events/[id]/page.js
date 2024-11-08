'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const EventQRCode = dynamic(
  () => import('../../components/EventQRCode'),
  { 
    loading: () => <p>Loading QR code...</p>,
    ssr: false
  }
);

const TIMEZONES = [
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' }
];

const formatDateTime = (dateString, timezone) => {
  if (!dateString) return 'Not set';
  try {
    // Create a date object from the string
    const date = new Date(dateString);
    // Format it according to the timezone
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    // Add additional validation
    if (typeof dateString !== 'string' || !Date.parse(dateString)) {
      console.log('Invalid date string:', dateString);
      return '';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('Invalid date object:', date);
      return '';
    }

    // Format as YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    console.log('Problematic date string:', dateString);
    return '';
  }
};

const EventDetailsPage = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [editForm, setEditForm] = useState({
    eventName: '',
    eventDate: '',
    endDate: '',
    photoLimit: '',
    status: 'not_started',
    timezone: 'America/Chicago'
  });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      const data = await response.json();
      console.log('Fetched event data:', data);
      
      if (data.success) {
        setEvent(data.event);
        
        const formData = {
          eventName: data.event.name,
          eventDate: formatDateForInput(data.event.date),
          endDate: formatDateForInput(data.event.end_date),
          photoLimit: data.event.photo_limit?.toString() || '0',
          status: data.event.status || 'not_started',
          timezone: data.event.timezone || 'America/Chicago'
        };

        console.log('Setting form data:', formData);
        setEditForm(formData);
      } else {
        setError('Failed to fetch event details');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: editForm.eventName,
          eventDate: editForm.eventDate,
          endDate: editForm.endDate,
          photoLimit: editForm.photoLimit,
          status: editForm.status,
          timezone: editForm.timezone
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEvent(result.event);
        setIsEditing(false);
        setSuccessMessage('Event updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(result.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to update event');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isEditing ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Event Name</label>
              <input
                type="text"
                value={editForm.eventName}
                onChange={(e) => setEditForm({...editForm, eventName: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Time Zone</label>
              <select 
                value={editForm.timezone}
                onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({...editForm, eventDate: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit Event
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="font-semibold">Start Date & Time</h2>
                  <p>{formatDateTime(event.date, event.timezone)} ({event.timezone})</p>
                </div>
                <div>
                  <h2 className="font-semibold">End Date & Time</h2>
                  <p>{formatDateTime(event.end_date, event.timezone)} ({event.timezone})</p>
                </div>
              </div>
              <div>
                <h2 className="font-semibold">Status</h2>
                <p>{event.status}</p>
              </div>
              <div>
                <h2 className="font-semibold">Photo Limit</h2>
                <p>{event.photo_limit || 0}</p>
              </div>
            </div>
          </>
        )}
      </div>
      
      {!isEditing && event && event.id && (
        <EventQRCode eventId={event.id} />
      )}
    </div>
  );
};

export default EventDetailsPage;
