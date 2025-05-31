
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth"; // Garantir que Auth está aqui
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAg7M7Cus5vv3uBm8NedoXKZ8_YyhhXRY4",
  authDomain: "limaconnect-df2c1.firebaseapp.com",
  projectId: "limaconnect-df2c1",
  storageBucket: "limaconnect-df2c1.firebasestorage.app",
  messagingSenderId: "152566740991",
  appId: "1:152566740991:web:e1cf7f81ba6041b75719ca",
  measurementId: "G-E232K2M82N"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth; // Definido
let analytics: Analytics | undefined;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    // Inicializar Analytics apenas no cliente
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.error("Error initializing Firebase Analytics on new app instance:", e);
    }
  }
} else {
  app = getApps()[0];
  if (typeof window !== 'undefined') {
    // Tentar obter Analytics se o app já existe (pode já ter sido inicializado)
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.error("Error initializing Firebase Analytics for existing app instance:", e);
    }
  }
}

db = getFirestore(app);
auth = getAuth(app); // Inicializado aqui

export { db, auth, app, analytics }; // Exportar auth, app e analytics
