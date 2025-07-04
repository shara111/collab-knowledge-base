import React, { useState, useEffect } from "react";
import {db} from "./firebase.js";
import {collection, addDoc, getDocs, query, where} from "firebase/firestore";
import {Link} from "react-router-dom";

export default function Home ({user}) {
    const [docs, setDocs] = useState([]);

    const createDoc = async () => {
        const newDoc = await addDoc(collection(db, "documents"), {
            owner: user.uid,
            content: "",
            createdAt: Date.now(),
        })
        window.location.href = `/editor/${newDoc.id}`; 
    };

    useEffect(()=>{
        const fetchDocs = async () => {
            const q = query(collection(db, "documents"), where("owner", "==", user.uid));
            const snapshot = await getDocs(q);
            const docsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDocs(docsList);
        };
        fetchDocs();
    }, [user.uid]);
    return (
        <div>
          <h2>Your Documents</h2>
          <button onClick={createDoc}>+ New Document</button>
          <ul>
            {docs.map(doc => (
              <li key={doc.id}>
                <Link to={`/editor/${doc.id}`}>Document {doc.id.slice(0, 6)}</Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }