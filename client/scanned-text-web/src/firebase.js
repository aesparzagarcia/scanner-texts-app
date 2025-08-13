// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgg4aYloDlPbzuLTy4UW_NGOA2vyCdRmA",
  authDomain: "text-scan-e9da3.firebaseapp.com",
  projectId: "text-scan-e9da3",
  storageBucket: "text-scan-e9da3.firebasestorage.app",
  messagingSenderId: "510670168047",
  appId: "1:510670168047:web:d2a8bb867193269296601a",
  measurementId: "G-YQEP7VB95K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
