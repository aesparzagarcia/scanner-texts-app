// src/App.js
/*import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthForm from './AuthForm';
import MainApp from './MainApp';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false); // ✅ auth check finished
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>⏳ Checking session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* Header *//*}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#007BFF',
        color: 'white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}></h2>
        <div>
          <span style={{ marginRight: 16 }}>Bienvenido, <strong>{user.email}</strong></span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dc3545'}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main content *//*}
      <main style={{ padding: 20 }}>
        <MainApp />
      </main>
    </div>
  );
}

export default App;*/

// src/App.js
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import AuthForm from './AuthForm';
import MainApp from './MainApp';

function App() {
  const [user, setUser] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLeader(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();

        if (!userData?.is_leader) {
          await signOut(auth);
          setUser(null);
          setIsLeader(false);
          return;
        }

        setUser(firebaseUser);
        setIsLeader(true);
      } catch (err) {
        console.error('Auth check failed', err);
        await signOut(auth);
        setUser(null);
        setIsLeader(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ⚠️ Flicker still exists – we fix this in the NEXT step
  if (!user || !isLeader) {
    return <AuthForm />;
  }

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#007BFF',
          color: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        <span>
          Bienvenido, <strong>{user.email}</strong>
        </span>

        <button
          onClick={() => signOut(auth)}
          style={{
            padding: '6px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Salir
        </button>
      </header>

      <main style={{ padding: 20 }}>
        <MainApp />
      </main>
    </div>
  );
}

export default App;

