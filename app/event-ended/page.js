'use client';

export default function EventEndedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Thank You for Celebrating!
          </h2>
          
          <div className="mt-8 space-y-4">
            <div className="text-gray-600">
              <p className="mb-4">
                This event has ended and the photo booth is no longer active.
              </p>
              <p>
                We hope you enjoyed capturing memories with us!
              </p>
            </div>

            {/* Optional: Add event details or gallery link here */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If you have any questions, please contact the event organizer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
