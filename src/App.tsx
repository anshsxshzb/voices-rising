/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import About from './pages/About';
import Login from './pages/Login';
import Admin from './pages/Admin';
import WriterDashboard from './pages/WriterDashboard';
import ReaderDashboard from './pages/ReaderDashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubReader: (() => void) | undefined;
    let unsubRequest: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubReader) unsubReader();
      if (unsubRequest) unsubRequest();

      if (user) {
        const email = user.email;
        if (email === 'anshsxshzb@gmail.com') {
          localStorage.setItem('userRole', 'admin');
          window.dispatchEvent(new Event('userRoleChanged'));
          setIsAuthReady(true);
        } else {
          let isReader = false;
          let readerRole = 'reader';
          let isPending = false;
          let isDenied = false;
          let initReader = false;
          let initPending = false;

          const updateRole = () => {
            if (!initReader || !initPending) return;
            
            if (isReader) {
              localStorage.setItem('userRole', readerRole);
              window.dispatchEvent(new Event('userRoleChanged'));
            } else if (isPending) {
              localStorage.setItem('userRole', 'pending');
              window.dispatchEvent(new Event('userRoleChanged'));
            } else if (isDenied) {
              const currentRole = localStorage.getItem('userRole');
              if (currentRole === 'pending') {
                alert("Your access request was denied by the admin.");
                auth.signOut();
              }
              localStorage.removeItem('userRole');
              window.dispatchEvent(new Event('userRoleChanged'));
            } else {
              localStorage.removeItem('userRole');
              window.dispatchEvent(new Event('userRoleChanged'));
            }
          };

          unsubReader = onSnapshot(doc(db, 'readers', email!), (docSnap) => {
            isReader = docSnap.exists();
            if (isReader) {
              readerRole = docSnap.data()?.role || 'reader';
            }
            initReader = true;
            updateRole();
            if (initReader && initPending) setIsAuthReady(true);
          }, (err) => {
            console.error(err);
            initReader = true;
            if (initReader && initPending) setIsAuthReady(true);
          });

          unsubRequest = onSnapshot(doc(db, 'access_requests', email!), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data && data.status === 'denied') {
                isPending = false;
                isDenied = true;
              } else {
                isPending = true;
                isDenied = false;
              }
            } else {
              isPending = false;
              isDenied = false;
            }
            initPending = true;
            updateRole();
            if (initReader && initPending) setIsAuthReady(true);
          }, (err) => {
            console.error(err);
            initPending = true;
            if (initReader && initPending) setIsAuthReady(true);
          });
        }
      } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.dispatchEvent(new Event('userRoleChanged'));
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribe();
      if (unsubReader) unsubReader();
      if (unsubRequest) unsubRequest();
    };
  }, []);

    if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div></div>;
  }

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans text-zinc-900">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/writer" element={<WriterDashboard />} />
              <Route path="/reader" element={<ReaderDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

