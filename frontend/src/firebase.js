import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:        process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:     process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId:         process.env.REACT_APP_FIREBASE_APP_ID,
};

let auth = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];
  auth = getAuth(app);
}

export { auth };
