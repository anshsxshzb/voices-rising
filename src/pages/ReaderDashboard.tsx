import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole, submitWriterApplication, useMyWriterApplication } from '../lib/storage';
import { auth } from '../lib/firebase';
import { PenTool, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function ReaderDashboard() {
  const navigate = useNavigate();
  const userRole = useUserRole();
  const { application: userApplication, loading } = useMyWriterApplication();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userRole !== 'reader') {
      navigate('/');
    }
  }, [userRole, navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-transparent border border-zinc-900 overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
              <PenTool className="h-8 w-8 text-zinc-900" />
              <h1 className="text-3xl font-black text-zinc-900 font-serif uppercase tracking-widest">Apply to be a Writer</h1>
            </div>
            
            <p className="text-zinc-800 mb-10 font-serif leading-relaxed">
              Share your voice with our community. As a writer, you can publish articles, essays, and stories about human rights.
            </p>

            {userApplication ? (
              <div className={`border p-8 ${
                userApplication.status === 'pending' ? 'bg-zinc-100 border-zinc-900' :
                userApplication.status === 'approved' ? 'bg-zinc-900 border-zinc-900 text-white' :
                'bg-red-50 border-red-800 text-red-800'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {userApplication.status === 'pending' && <Clock className="h-6 w-6 text-zinc-900" />}
                    {userApplication.status === 'approved' && <CheckCircle className="h-6 w-6 text-white" />}
                    {userApplication.status === 'rejected' && <XCircle className="h-6 w-6 text-red-800" />}
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-bold uppercase tracking-widest ${
                      userApplication.status === 'pending' ? 'text-zinc-900' :
                      userApplication.status === 'approved' ? 'text-white' :
                      'text-red-800'
                    }`}>
                      Application {userApplication.status.charAt(0).toUpperCase() + userApplication.status.slice(1)}
                    </h3>
                    <div className={`mt-4 font-serif italic ${
                      userApplication.status === 'pending' ? 'text-zinc-800' :
                      userApplication.status === 'approved' ? 'text-zinc-200' :
                      'text-red-900'
                    }`}>
                      {userApplication.status === 'pending' && <p>Your application is currently being reviewed by our team. We'll notify you once a decision is made.</p>}
                      {userApplication.status === 'approved' && <p>Congratulations! Your application has been approved. You can now access the Writer Dashboard.</p>}
                      {userApplication.status === 'rejected' && <p>Unfortunately, your application was not approved at this time. You can try applying again later.</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-800 text-red-800 px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="reason" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-3">
                    Why do you want to write for Voices Rising?
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="reason"
                      name="reason"
                      rows={6}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-4 border bg-transparent font-serif italic"
                      placeholder="Tell us about your background, what topics you're passionate about, and why you'd be a good fit..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-4 px-6 border border-zinc-900 rounded-none text-xs font-bold uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
