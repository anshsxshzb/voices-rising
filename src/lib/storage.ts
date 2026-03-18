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
  date: string;
  preview: string;
  content: string;
  published: boolean;
  comments?: Comment[];
}

export interface ReaderAccount {
  id: string;
  email: string;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  date: string;
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    let q;
    const isAuthorized = auth.currentUser && (auth.currentUser.email === 'anshsxshzb@gmail.com' || localStorage.getItem('userRole') === 'reader');
    
    if (isAuthorized) {
      q = query(collection(db, 'articles'), orderBy('date', 'desc'));
    } else {
      q = query(collection(db, 'articles'), where('published', '==', true), orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(data);
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
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
  }, [auth.currentUser]);

  if (fatalError) {
    throw fatalError;
  }

  return { articles, loading, error };
}

export function useReaders() {
  const [readers, setReaders] = useState<ReaderAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.email !== 'anshsxshzb@gmail.com') {
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
    if (!auth.currentUser || auth.currentUser.email !== 'anshsxshzb@gmail.com') {
      setRequests([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'access_requests'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
      setRequests(data);
      setLoading(false);
    }, (err) => {
      if (err.message.includes('Missing or insufficient permissions')) {
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

// Helper functions for mutations
export const addArticle = async (article: Omit<Article, 'id'>) => {
  try {
    const newId = Date.now().toString();
    await setDoc(doc(db, 'articles', newId), { ...article, comments: [] });
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

export const addReader = async (reader: Omit<ReaderAccount, 'id'>) => {
  try {
    await setDoc(doc(db, 'readers', reader.email), reader);
  } catch (err: any) {
    if (err.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, `readers/${reader.email}`);
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
