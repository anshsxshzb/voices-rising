import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { addAccessRequest } from '../lib/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const navigate = useNavigate();

  if (fatalError) {
    throw fatalError;
  }

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase();
      
      if (email === 'anshsxshzb@gmail.com') {
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('username', result.user.displayName || 'Admin');
        window.dispatchEvent(new Event('userRoleChanged'));
        navigate('/admin');
      } else {
        // Verify reader exists in readers collection
        try {
          const readerDoc = await getDoc(doc(db, 'readers', email!.toLowerCase()));
          if (readerDoc.exists()) {
            localStorage.setItem('userRole', 'reader');
            localStorage.setItem('username', result.user.displayName || email!);
            window.dispatchEvent(new Event('userRoleChanged'));
            navigate('/articles');
          } else {
            const requestDoc = await getDoc(doc(db, 'access_requests', email!.toLowerCase()));
            if (requestDoc.exists()) {
              const data = requestDoc.data();
              if (data && data.status === 'denied') {
                alert("Your access request was denied by the admin.");
                await auth.signOut();
                setLoading(false);
                return;
              } else {
                localStorage.setItem('userRole', 'pending');
                localStorage.setItem('username', result.user.displayName || email!);
                window.dispatchEvent(new Event('userRoleChanged'));
                navigate('/articles');
              }
            } else {
              // Create an access request for the admin to approve
              await addAccessRequest({
                email: email!.toLowerCase(),
                name: result.user.displayName || 'Anonymous',
                photoURL: result.user.photoURL || undefined,
                date: new Date().toISOString(),
                status: 'pending'
              });
              localStorage.setItem('userRole', 'pending');
              localStorage.setItem('username', result.user.displayName || email!);
              window.dispatchEvent(new Event('userRoleChanged'));
              navigate('/articles');
            }
          }
        } catch (err: any) {
          if (err.message?.includes('Missing or insufficient permissions')) {
            try {
              handleFirestoreError(err, OperationType.GET, `readers/${email}`);
            } catch (e) {
              setFatalError(e as Error);
              return;
            }
          }
          throw err;
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Missing or insufficient permissions')) {
        setFatalError(err);
        return;
      }
      console.error(err);
      setError('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-transparent p-10 border border-zinc-900">
        <div>
          <h2 className="mt-6 text-center text-3xl font-black text-zinc-900 font-serif uppercase tracking-widest">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div className="text-red-800 text-xs font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-zinc-900 bg-transparent hover:bg-zinc-100 focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
