import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuC3zXrNa69yIX7HJRRG32RD3_OtWw2PE",
    authDomain: "blog-pro-520a6.firebaseapp.com",
    projectId: "blog-pro-520a6",
    storageBucket: "blog-pro-520a6.firebasestorage.app",
    messagingSenderId: "302282337310",
    appId: "1:302282337310:web:99f74ea92754acf798520f",
    measurementId: "G-6PM4C2YLRH"
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 최신 방식의 Firestore 초기화 (서버 사이드와 클라이언트 사이드 구분)
let db: Firestore;
if (typeof window !== "undefined") {
    // 클라이언트: 멀티 탭 지원 캐시 설정
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
} else {
    // 서버: 기본 설정
    db = getFirestore(app);
}

export { db };
