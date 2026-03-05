import * as admin from 'firebase-admin';

// 중복 초기화 방지
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin Init Error:', error);
  }
}

export const db = admin.firestore();
