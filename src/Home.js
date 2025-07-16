import React, { useState, useEffect } from "react";
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Home({ user }) {
  const [docs, setDocs] = useState([]);

  const createDoc = async () => {
    const title = prompt("What do you want to name your new document?");
    if (!title) return;

    const newDoc = await addDoc(collection(db, "documents"), {
      owner: user.uid,
      title,
      content: "",
      createdAt: Date.now(),
    });

    window.location.href = `/editor/${newDoc.id}`;
  };

  const renameDoc = async (id, currentTitle) => {
    const newTitle = prompt("Enter a new title for the document:", currentTitle);
    if (!newTitle) return;

    await updateDoc(doc(db, "documents", id), {
      title: newTitle,
    });

    setDocs((prevDocs) =>
      prevDocs.map((docItem) =>
        docItem.id === id ? { ...docItem, title: newTitle } : docItem
      )
    );
  };

  const deleteDocById = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "documents", id));

    setDocs((prevDocs) => prevDocs.filter((docItem) => docItem.id !== id));
  };

  useEffect(() => {
    const fetchDocs = async () => {
      const q = query(collection(db, "documents"), where("owner", "==", user.uid));
      const snapshot = await getDocs(q);
      const docsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDocs(docsList);
    };
    fetchDocs();
  }, [user.uid]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">📄 Your Documents</h2>
      <button
        onClick={createDoc}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + New Document
      </button>

      <ul className="space-y-4">
        {docs.map((docItem) => (
          <li
            key={docItem.id}
            className="flex justify-between items-center bg-white p-3 rounded shadow border"
          >
            <Link
              to={`/editor/${docItem.id}`}
              className="text-blue-700 font-medium hover:underline"
            >
              {docItem.title || `Untitled (${docItem.id.slice(0, 6)})`}
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => renameDoc(docItem.id, docItem.title)}
                className="text-yellow-700 hover:text-yellow-900"
              >
                ✏️ Rename
              </button>
              <button
                onClick={() => deleteDocById(docItem.id)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️ Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
