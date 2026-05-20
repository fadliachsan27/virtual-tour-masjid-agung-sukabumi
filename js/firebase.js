import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyA6b5hiSH7BWAXOWu3_-cwXtMl6J3sTGxA",
  authDomain: "vt-masjid-agung-sukabumi.firebaseapp.com",
  projectId: "vt-masjid-agung-sukabumi",
  storageBucket: "vt-masjid-agung-sukabumi.firebasestorage.app",
  messagingSenderId: "633933684627",
  appId: "1:633933684627:web:fdcaa9d3ff99475e665266",
  measurementId: "G-GG88GW221Z"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
