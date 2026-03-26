import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isWebFirebaseConfigured } from './firebase';
import AuthForm from './AuthForm';
import MainApp from './MainApp';

function App() {
  const [user, setUser] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setIsLeader(false);
          return;
        }

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
        try {
          await signOut(auth);
        } catch (_) {
          /* ignore */
        }
        setUser(null);
        setIsLeader(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (process.env.NODE_ENV !== 'test' && !isWebFirebaseConfigured) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'Arial, sans-serif',
          maxWidth: 520,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>
            Firebase no está configurado en la web
          </h1>
          <p style={{ color: '#444', lineHeight: 1.5 }}>
            Añade en <code>.env</code> (en la carpeta del proyecto web) las variables{' '}
            <code>REACT_APP_FIREBASE_API_KEY</code>, <code>REACT_APP_FIREBASE_AUTH_DOMAIN</code>,{' '}
            <code>REACT_APP_FIREBASE_PROJECT_ID</code>, etc. Copia los valores desde la consola de
            Firebase → Configuración del proyecto → Tus apps. Luego reinicia{' '}
            <code>npm start</code>.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>⏳ Checking session...</p>
      </div>
    );
  }

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

