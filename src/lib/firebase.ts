
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAuth, type Auth } from "firebase/auth"; // Para autenticação futura

// Substitua pelas configurações do seu projeto Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // SUBSTITUA
  authDomain: "YOUR_AUTH_DOMAIN", // SUBSTITUA
  projectId: "YOUR_PROJECT_ID", // SUBSTITUA
  storageBucket: "YOUR_STORAGE_BUCKET", // SUBSTITUA
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // SUBSTITUA
  appId: "YOUR_APP_ID", // SUBSTITUA
};

let app: FirebaseApp;
let db: Firestore;
// let auth: Auth; // Para autenticação futura

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
// auth = getAuth(app); // Para autenticação futura

export { db /*, auth */ }; // Exporte 'auth' quando for usá-lo
