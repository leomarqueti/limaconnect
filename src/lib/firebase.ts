
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics"; // Adicionada importação e tipo para Analytics
// import { getAuth, type Auth } from "firebase/auth"; // Para autenticação futura

// Configuração do Firebase fornecida pelo usuário
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
let analytics: Analytics | undefined;
// let auth: Auth; // Para autenticação futura

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Inicializar Analytics apenas se estiver no navegador
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  // Se o app já existe, o analytics também pode já ter sido inicializado
  // Para garantir que temos a instância, podemos tentar obtê-la novamente (se não existir)
  if (typeof window !== 'undefined') {
    try {
        // Tenta obter a instância existente ou criar uma nova se necessário.
        // A SDK do Firebase é geralmente inteligente o suficiente para não reinicializar desnecessariamente.
        analytics = getAnalytics(app);
    } catch (e) {
        console.error("Error initializing Firebase Analytics for existing app instance:", e);
    }
  }
}

db = getFirestore(app);
// auth = getAuth(app); // Para autenticação futura

export { db, app, analytics /*, auth */ }; // Exporta 'app' e 'analytics' também, caso sejam necessários
