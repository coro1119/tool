import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuC3zXrNa69yIX7HJRRG32RD3_OtWw2PE",
    authDomain: "blog-pro-520a6.firebaseapp.com",
    projectId: "blog-pro-520a6",
    storageBucket: "blog-pro-520a6.firebasestorage.app",
    messagingSenderId: "302282337310",
    appId: "1:302282337310:web:99f74ea92754acf798520f",
    measurementId: "G-6PM4C2YLRH"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
