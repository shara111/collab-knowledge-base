// src/Editor.js
import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import * as Y from "yjs";
import { QuillBinding } from "y-quill";
import { WebsocketProvider } from "y-websocket";
import { db } from "./firebase.js"; //import Firestore
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import "quill/dist/quill.snow.css";
import SummaryHistory from "./SummaryHistory.js";

export default function Editor({ user }) {
  const { id } = useParams(); // document ID
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", id, ydoc);

    const ytext = ydoc.getText("quill");

    // Initialize Quill
    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Start writing...",
    });
    quillRef.current = quill;

    // Bind Quill + Y.js
    const binding = new QuillBinding(ytext, quill, provider.awareness);

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [id]);

  const handleGenerateSummary = async () => {
    const plainText = quillRef.current.getText();
  
    const response = await fetch("http://localhost:5001/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: plainText }),
    });
  
    const data = await response.json();
    const summary = data.summary || "⚠️ No summary returned.";
    const actions = data.actions || [];
  
    alert("🧠 Summary:\n" + summary + "\n\n📋 Action Items:\n" + actions.join("\n"));
  
    await addDoc(collection(db, "summaries"), {
      uid: user.uid,
      email: user.email,
      content: plainText,
      summary,
      actions,
      createdAt: serverTimestamp(),
    });
  };
  return (
    <div className='max-w-4xl mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-4 text-gray-800'>
        ✍️ Collaborative Knowledge Base
      </h2>

      <div
        ref={editorRef}
        className='h-[60vh] bg-white border border-gray-300 rounded-md shadow-sm'
      />

      <div className='mt-4 flex gap-4'>
        <button
          onClick={handleGenerateSummary}
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition'
        >
          🧠 Generate Summary
        </button>

        

      </div>

      <SummaryHistory user={user} />
    </div>
  );
}
