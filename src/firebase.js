// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9_7EUMmrCSm7pJfsHRcBJaNL_gtJ1qk0",
  authDomain: "knowledgebase-project-ddbc6.firebaseapp.com",
  projectId: "knowledgebase-project-ddbc6",
  storageBucket: "knowledgebase-project-ddbc6.firebasestorage.app",
  messagingSenderId: "897420762892",
  appId: "1:897420762892:web:8f8d6d677f2358643d7329",
  measurementId: "G-78ZY5KRFZY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };