import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6hoJfxSjtZfdO--YmuMlRH1Cy-VoDXZI",
  authDomain: "prode-mundial26-24ef8.firebaseapp.com",
  projectId: "prode-mundial26-24ef8",
  storageBucket: "prode-mundial26-24ef8.firebasestorage.app",
  messagingSenderId: "1092097917653",
  appId: "1:1092097917653:web:2ce2a5c02425f39c35d85c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
