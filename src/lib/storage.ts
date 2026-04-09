import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from './firebase';

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

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  authorEmail?: string;
  date: string;
  preview: string;
  content: string;
  published: boolean;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
  rejectionReason?: string;
  comments?: Comment[];
  views?: number;
  likedBy?: string[];
  tags?: string[];
  readTime?: number;
}

export interface ReaderAccount {
  id: string;
  email: string;
  role?: 'reader' | 'writer';
  displayName?: string;
  photoURL?: string;
}

export interface AppNotification {
  id: string;
  userEmail: string;
  message: string;
  type?: 'approved' | 'rejected' | 'info';
  articleId?: string;
  read: boolean;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  date: string;
  status?: 'pending' | 'denied';
}

export interface WriterApplication {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function useUserRole() {
  const [role, setRole] = useState<string | null>(localStorage.getItem('userRole'));

  useEffect(() => {
    const handleRoleChange = () => {
      setRole(localStorage.getItem('userRole'));
    };
    window.addEventListener('userRoleChanged', handleRoleChange);
    return () => window.removeEventListener('userRoleChanged', handleRoleChange);
  }, []);

  return role;
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const userRole = useUserRole();

  useEffect(() => {
    let q;
    const isAdmin = auth.currentUser && auth.currentUser.email?.toLowerCase() === 'anshsxshzb@gmail.com';
    
    if (isAdmin) {
      q = query(collection(db, 'articles'), orderBy('date', 'desc'));
    } else {
      // For readers, writers (viewing main feed), and pending users, only show published articles
      // Note: We use the 'published' boolean for backward compatibility, but could also check status
      q = query(collection(db, 'articles'), where('published', '==', true), orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(data);
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          setLoading(false);
          return;
        }
        try {
          handleFirestoreError(err, OperationType.LIST, 'articles');
        } catch (e) {
          setFatalError(e as Error);
        }
      } else {
        setError(err.message);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser?.uid, userRole]);

  if (fatalError) {
    throw fatalError;
  }

  return { articles, loading, error };
}

export function useWriterArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setArticles([]);
      setLoading(false);
      return;
    }

    // Writers fetch their own articles
    const q = query(
      collection(db, 'articles'), 
      where('authorEmail', '==', auth.currentUser.email?.toLowerCase()),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(data);
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          setLoading(false);
          return;
        }
      }
      setError(err.message);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser?.uid]);

  return { articles, loading, error };
}

export function useReaders() {
  const [readers, setReaders] = useState<ReaderAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.email?.toLowerCase() !== 'anshsxshzb@gmail.com') {
      setReaders([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'readers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReaderAccount));
      setReaders(data);
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          setLoading(false);
          return;
        }
        try {
          handleFirestoreError(err, OperationType.LIST, 'readers');
        } catch (e) {
          setFatalError(e as Error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  if (fatalError) {
    throw fatalError;
  }

  return { readers, loading };
}

export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.email?.toLowerCase() !== 'anshsxshzb@gmail.com') {
      setRequests([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'access_requests'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
      setRequests(data.filter(r => r.status !== 'denied'));
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          setLoading(false);
          return;
        }
        try {
          handleFirestoreError(err, OperationType.LIST, 'access_requests');
        } catch (e) {
          setFatalError(e as Error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  if (fatalError) {
    throw fatalError;
  }

  return { requests, loading };
}

export function useWriterApplications() {
  const [applications, setApplications] = useState<WriterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'writer_applications'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WriterApplication));
      setApplications(data);
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          setLoading(false);
          return;
        }
        try {
          handleFirestoreError(err, OperationType.LIST, 'writer_applications');
        } catch (e) {
          setFatalError(e as Error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  if (fatalError) {
    throw fatalError;
  }

  return { applications, loading };
}

export function useMyWriterApplication() {
  const [application, setApplication] = useState<WriterApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser || !auth.currentUser.email) {
      setApplication(null);
      setLoading(false);
      return;
    }

    const email = auth.currentUser.email.toLowerCase();
    const unsubscribe = onSnapshot(doc(db, 'writer_applications', email), (docSnap) => {
      if (docSnap.exists()) {
        setApplication({ id: docSnap.id, ...docSnap.data() } as WriterApplication);
      } else {
        setApplication(null);
      }
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          setLoading(false);
          return;
        }
        try {
          handleFirestoreError(err, OperationType.GET, `writer_applications/${email}`);
        } catch (e) {
          setFatalError(e as Error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  if (fatalError) {
    throw fatalError;
  }

  return { application, loading };
}

// Helper functions for mutations
export const calculateReadTime = (content?: string): number => {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

export const addArticle = async (article: Omit<Article, 'id'>) => {
  try {
    const newId = Date.now().toString();
    const status = article.status || (article.published ? 'published' : 'draft');
    await setDoc(doc(db, 'articles', newId), { ...article, status, comments: [], views: 0, likedBy: [] });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, 'articles');
    }
    throw err;
  }
};

export const updateArticle = async (id: string, updatedData: Partial<Article>) => {
  try {
    await updateDoc(doc(db, 'articles', id), updatedData);
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `articles/${id}`);
    }
    throw err;
  }
};

export const deleteArticle = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'articles', id));
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, `articles/${id}`);
    }
    throw err;
  }
};

export const addComment = async (articleId: string, comment: Omit<Comment, 'id' | 'date'>, currentComments: Comment[] = []) => {
  try {
    const newComment = {
      ...comment,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    await updateDoc(doc(db, 'articles', articleId), {
      comments: [...currentComments, newComment]
    });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `articles/${articleId}`);
    }
    throw err;
  }
};

export const incrementViewCount = async (articleId: string, currentViews: number = 0) => {
  try {
    await updateDoc(doc(db, 'articles', articleId), {
      views: currentViews + 1
    });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `articles/${articleId}`);
    }
    throw err;
  }
};

export const toggleLike = async (articleId: string, userEmail: string, currentLikedBy: string[] = []) => {
  try {
    const hasLiked = currentLikedBy.includes(userEmail);
    const newLikedBy = hasLiked 
      ? currentLikedBy.filter(email => email !== userEmail)
      : [...currentLikedBy, userEmail];
      
    await updateDoc(doc(db, 'articles', articleId), {
      likedBy: newLikedBy
    });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `articles/${articleId}`);
    }
    throw err;
  }
};

export const addReader = async (reader: Omit<ReaderAccount, 'id'>) => {
  try {
    await setDoc(doc(db, 'readers', reader.email), { ...reader, role: reader.role || 'reader' });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, `readers/${reader.email}`);
    }
    throw err;
  }
};

export const updateReaderRole = async (email: string, role: 'reader' | 'writer') => {
  try {
    await updateDoc(doc(db, 'readers', email), { role });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `readers/${email}`);
    }
    throw err;
  }
};

export const deleteReader = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'readers', id));
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, `readers/${id}`);
    }
    throw err;
  }
};

export const addAccessRequest = async (request: Omit<AccessRequest, 'id'>) => {
  try {
    await setDoc(doc(db, 'access_requests', request.email), request);
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, `access_requests/${request.email}`);
    }
    throw err;
  }
};

export const deleteAccessRequest = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'access_requests', id));
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, `access_requests/${id}`);
    }
    throw err;
  }
};

export const submitWriterApplication = async (application: Omit<WriterApplication, 'id'>) => {
  try {
    await setDoc(doc(db, 'writer_applications', application.email), application);
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, `writer_applications/${application.email}`);
    }
    throw err;
  }
};

export const updateWriterApplicationStatus = async (email: string, status: 'approved' | 'rejected') => {
  try {
    await updateDoc(doc(db, 'writer_applications', email), { status });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `writer_applications/${email}`);
    }
    throw err;
  }
};

export const denyAccessRequest = async (email: string) => {
  try {
    await updateDoc(doc(db, 'access_requests', email), { status: 'denied' });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `access_requests/${email}`);
    }
    throw err;
  }
};

export const addNotification = async (notification: Omit<AppNotification, 'id'>) => {
  try {
    const newId = Date.now().toString();
    await setDoc(doc(db, 'notifications', newId), notification);
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    }
    throw err;
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
    throw err;
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  useEffect(() => {
    if (!auth.currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userEmail', '==', auth.currentUser.email?.toLowerCase()),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(data);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        if (sessionStorage.getItem('isLoggingOut') === 'true' || !auth.currentUser) {
          return;
        }
      }
      console.error("Error fetching notifications", err);
    });

    return unsubscribe;
  }, [auth.currentUser?.uid]);

  return notifications;
}
