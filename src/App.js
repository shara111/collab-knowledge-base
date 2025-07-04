// src/App.js
import React, { useEffect, useState } from "react";
import { auth, provider, signInWithPopup, signOut } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";
import Editor from "./Editor.js";
import Home from "./Home.js";


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">📘 Collaborative KB</h2>
        <button
          onClick={handleLogin}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="p-4 bg-white shadow-md border-b flex justify-between items-center">
  <div className="text-sm text-gray-700">
    ✅ Logged in as <span className="font-medium text-blue-600">{user.displayName}</span><br />
    <span className="text-xs text-gray-500">{user.email}</span>
  </div>
  <button
    onClick={handleLogout}
    className="bg-gray-800 hover:bg-gray-900 text-white text-sm py-1 px-4 rounded-md transition"
  >
    🚪 Log out
  </button>
</div>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/editor/:id" element={<Editor user={user} />} />
      </Routes>
    </Router>
  );
}
export default App;
// This is a simple React app that uses Firebase for authentication.
