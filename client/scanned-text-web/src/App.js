// src/App.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthForm from './AuthForm';
import MainApp from './MainApp';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (!user) {
    return <AuthForm onLogin={setUser} />;
  }

  return (
    <div>
      <div style={{ padding: 10, backgroundColor: '#eee' }}>
        Bienvenido: {user.email} <button onClick={handleLogout}>Salir</button>
      </div>
      <MainApp />
    </div>
  );
}

export default App;
