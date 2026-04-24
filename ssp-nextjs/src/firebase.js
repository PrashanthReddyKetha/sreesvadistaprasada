import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];
  auth = getAuth(app);
}

export { auth };
