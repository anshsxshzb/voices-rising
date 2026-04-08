import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole, submitWriterApplication, useWriterApplications } from '../lib/storage';
import { auth } from '../lib/firebase';
import { PenTool, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function ReaderDashboard() {
  const navigate = useNavigate();
  const userRole = useUserRole();
  const { applications } = useWriterApplications();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userRole !== 'reader') {
      navigate('/');
    }
  }, [userRole, navigate]);

  const userApplication = applications.find(app => app.email === auth.currentUser?.email?.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitWriterApplication({
        email: auth.currentUser!.email!.toLowerCase(),
        name: auth.currentUser!.displayName || 'Anonymous',
        photoURL: auth.currentUser!.photoURL || undefined,
        reason: reason.trim(),
        date: new Date().toISOString(),
        status: 'pending'
      });
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole !== 'reader') return null;

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg border border-zinc-200 overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <PenTool className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-extrabold text-zinc-900 font-serif">Apply to be a Writer</h1>
            </div>
            
            <p className="text-zinc-600 mb-8 text-lg">
              Share your voice with our community. As a writer, you can publish articles, essays, and stories about human rights.
            </p>

            {userApplication ? (
              <div className={`rounded-md p-6 ${
                userApplication.status === 'pending' ? 'bg-blue-50 border border-blue-200' :
                userApplication.status === 'approved' ? 'bg-green-50 border border-green-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {userApplication.status === 'pending' && <Clock className="h-6 w-6 text-blue-600" />}
                    {userApplication.status === 'approved' && <CheckCircle className="h-6 w-6 text-green-600" />}
                    {userApplication.status === 'rejected' && <XCircle className="h-6 w-6 text-red-600" />}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-lg font-medium ${
                      userApplication.status === 'pending' ? 'text-blue-800' :
                      userApplication.status === 'approved' ? 'text-green-800' :
                      'text-red-800'
                    }`}>
                      Application {userApplication.status.charAt(0).toUpperCase() + userApplication.status.slice(1)}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      userApplication.status === 'pending' ? 'text-blue-700' :
                      userApplication.status === 'approved' ? 'text-green-700' :
                      'text-red-700'
                    }`}>
                      {userApplication.status === 'pending' && <p>Your application is currently being reviewed by our team. We'll notify you once a decision is made.</p>}
                      {userApplication.status === 'approved' && <p>Congratulations! Your application has been approved. You can now access the Writer Dashboard.</p>}
                      {userApplication.status === 'rejected' && <p>Unfortunately, your application was not approved at this time. You can try applying again later.</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-zinc-700">
                    Why do you want to write for Voices Rising?
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="reason"
                      name="reason"
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-zinc-300 rounded-md p-3 border"
                      placeholder="Tell us about your background, what topics you're passionate about, and why you'd be a good fit..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
