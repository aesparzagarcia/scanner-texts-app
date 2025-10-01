import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import MainApp from './MainApp';
import AuthForm from './AuthForm';

function ProtectedMainApp() {
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLeader(false);
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (!userData?.is_leader) {
        await signOut(auth);
        setIsLeader(false);
        setLoading(false);
        return;
      }

      setIsLeader(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>⏳ Checking access...</p>;

  return isLeader ? <MainApp /> : <AuthForm />;
}

export default ProtectedMainApp;
