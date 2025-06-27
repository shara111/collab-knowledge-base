// src/App.js
import React, { useEffect, useState } from "react";
import { auth, provider, signInWithPopup, signOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Collaborative Knowledge Base</h1>
      {!user ? (
        <>
          <button onClick={handleLogin}>Sign in with Google</button>
        </>
      ) : (
        <>
          <p>Welcome, {user.displayName} ({user.email})</p>
          <button onClick={handleLogout}>Sign Out</button>
        </>
      )}
    </div>
  );
}

export default App;
// This is a simple React app that uses Firebase for authentication.
