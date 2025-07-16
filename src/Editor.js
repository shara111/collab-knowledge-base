// src/Editor.js
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import QuillCursors from "quill-cursors";
import * as Y from "yjs";
import { QuillBinding } from "./vendor/y-quill.js";
import { WebsocketProvider } from "y-websocket";
import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import SummaryHistory from "./SummaryHistory.js";

import "quill/dist/quill.snow.css";
import "./Editor.css"; // for cursor color styling

Quill.register("modules/cursors", QuillCursors);

export default function Editor({ user }) {
  const { id } = useParams();
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const cursorsRef = useRef(null);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", id, ydoc);
    const ytext = ydoc.getText("quill");

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Start writing...",
      modules: {
        cursors: true,
        toolbar: [["bold", "italic", "underline"]],
      },
    });

    quillRef.current = quill;
    const cursors = quill.getModule("cursors");
    cursorsRef.current = cursors;

    const awareness = provider.awareness;
    const color = getColorForUser(user.uid);

    // Broadcast local user
    awareness.setLocalStateField("user", {
      name: user.email,
      color,
    });

    // Update cursor + selection
    quill.on("selection-change", (range) => {
      if (range) {
        awareness.setLocalStateField("cursor", {
          index: range.index,
          length: range.length,
        });
      }
    });

    // Listen to remote users
    awareness.on("change", () => {
      const states = Array.from(awareness.getStates().values());
      const others = states.filter((s) => s.user?.email !== user.email);
      setActiveUsers(states.map((s) => s.user).filter(Boolean));

      cursors.clearCursors();
      awareness.getStates().forEach((state, clientID) => {
        if (!state.user || !state.cursor) return;
        cursors.createCursor(clientID.toString(), state.user.name, state.user.color);
        cursors.moveCursor(clientID.toString(), state.cursor);
      });
    });

    const binding = new QuillBinding(ytext, quill, awareness);

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [id, user]);

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

      <div className='mb-4 text-sm text-gray-700'>
        <strong>Active users:</strong>{" "}
        {activeUsers.map((u, i) => (
          <span key={i} style={{ color: u.color, marginRight: "8px" }}>
            ● {u.name}
          </span>
        ))}
      </div>

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

// Generates a consistent color per user
function getColorForUser(uid) {
  const colors = ["#f87171", "#60a5fa", "#34d399", "#facc15", "#a78bfa", "#fb923c"];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
