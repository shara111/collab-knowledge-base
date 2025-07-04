import React, { useEffect, useState } from "react";
import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function SummaryHistory({ user }) {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "summaries"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id, // 👈 Include Firestore document ID
        ...doc.data(),
      }));
      setSummaries(docs);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this summary?")) {
      await deleteDoc(doc(db, "summaries", id));
    }
  };

  return (
    <div className='mt-6'>
      <h3 className='text-xl font-semibold mb-2'>🧾 Summary History</h3>
      {summaries.length === 0 ? (
        <p className='text-gray-500'>No summaries yet.</p>
      ) : (
        <ul className='space-y-4'>
          {summaries.map((item) => (
            <li
              key={item.id}
              className='border border-gray-300 rounded p-4 bg-white shadow-sm'
            >
              <p className='text-sm text-gray-600 mb-2'>
                {new Date(item.createdAt?.seconds * 1000).toLocaleString()}
              </p>
              <p className='mb-2'>
                <strong>Summary:</strong> {item.summary}
              </p>
              <p className='mb-2'>
                <strong>Original:</strong> {item.content}
              </p>

              <button
                onClick={() => handleDelete(item.id)}
                className='text-sm text-red-600 hover:underline'
              >
                🗑️ Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
