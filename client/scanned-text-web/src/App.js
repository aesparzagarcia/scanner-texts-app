import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isWebFirebaseConfigured } from './firebase';
import AuthForm from './AuthForm';
import MainApp from './MainApp';

const LOG = '[TextScan:App]';
const debugAuth =
  process.env.NODE_ENV === 'development' ||
  process.env.REACT_APP_DEBUG_AUTH === '1';

function App() {
  const [user, setUser] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (debugAuth) {
      console.info(LOG, 'useEffect: subscribe onAuthStateChanged', {
        isWebFirebaseConfigured,
      });
    }

    let authCallbackCompleted = false;
    const watchdogMs = 15000;
    const watchdogId = setTimeout(() => {
      if (!authCallbackCompleted) {
        console.warn(
          LOG,
          `Watchdog (${watchdogMs}ms): auth listener callback still not finished. Often: getDoc hanging (network/rules), wrong project, or browser blocking Firebase. Open Network tab for firestore.googleapis.com / identitytoolkit.`
        );
      }
    }, watchdogMs);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      if (debugAuth) {
        console.info(LOG, 'onAuthStateChanged fired', {
          hasUser: !!firebaseUser,
          uid: firebaseUser?.uid || null,
          email: firebaseUser?.email || null,
        });
      }

      try {
        if (!firebaseUser) {
          if (debugAuth) {
            console.info(LOG, 'branch: no Firebase user → show login');
          }
          setUser(null);
          setIsLeader(false);
          return;
        }

        if (debugAuth) {
          console.info(LOG, 'fetching Firestore users/', firebaseUser.uid);
        }
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        if (debugAuth) {
          console.info(LOG, 'getDoc result', {
            exists: userDoc.exists(),
            is_leader: userData?.is_leader,
            keys: userData ? Object.keys(userData).slice(0, 12) : [],
          });
        }

        if (!userData?.is_leader) {
          if (debugAuth) {
            console.info(
              LOG,
              'branch: user exists but is_leader is not true → signOut, show login'
            );
          }
          await signOut(auth);
          setUser(null);
          setIsLeader(false);
          return;
        }

        if (debugAuth) {
          console.info(LOG, 'branch: leader OK → main app');
        }
        setUser(firebaseUser);
        setIsLeader(true);
      } catch (err) {
        console.error(LOG, 'Auth / Firestore check FAILED', {
          code: err?.code,
          message: err?.message,
          name: err?.name,
          err,
        });
        try {
          await signOut(auth);
        } catch (_) {
          /* ignore */
        }
        setUser(null);
        setIsLeader(false);
      } finally {
        authCallbackCompleted = true;
        clearTimeout(watchdogId);
        if (debugAuth) {
          const ms =
            typeof performance !== 'undefined' ? Math.round(performance.now() - t0) : '?';
          console.info(LOG, 'finally: setAuthLoading(false)', { ms });
        }
        setAuthLoading(false);
      }
    });

    return () => {
      clearTimeout(watchdogId);
      unsubscribe();
    };
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

