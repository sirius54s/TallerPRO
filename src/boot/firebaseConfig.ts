import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

// Configuración firebase con variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENTID,
}

//manejo de errores

let ERROR_CODES = null
// Intentar inicializar Firebase
let firebaseApp: FirebaseApp
let auth: Auth
let db: Firestore

try {
  firebaseApp = initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  db = getFirestore(firebaseApp)
  console.log("✅ Firebase inicializado correctamente")
} catch (error: unknown) {
  console.log("❌ Error initializing Firebase:", error)

  // Type guard para verificar si es un error
  const firebaseError = error as { code?: string; message?: string }
  if (firebaseError.code) {
    switch (firebaseError.code) {
      case "auth/invalid-api-key":
        console.error("Clave API inválida")
        ERROR_CODES = "E1001"
        break
      case "auth/network-request-failed":
        console.error("Error de red")
        ERROR_CODES = "E1002"
        break
      case "auth/missing-config":
        console.error(" Configuración faltante")
        ERROR_CODES = "E1003"
        break
      default:
        console.error(" Error desconocido")
        ERROR_CODES = "E1004"
    }
  }
}

export { firebaseApp, auth, db, ERROR_CODES }
// Servicios de Firebase
