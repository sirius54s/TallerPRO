// src/boot/firebaseConfig.ts
import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

// Códigos de error - EXPORTADO EXPLÍCITAMENTE
const ERROR_CODES = {
  INVALID_API_KEY: 1001,
  NETWORK_ERROR: 1002,
  MISSING_CONFIG: 1003,
  FIREBASE_ERROR: 1004,
  INVALID_PROJECT: 1005,
  QUOTA_EXCEEDED: 1006,
  PERMISSION_DENIED: 1007,
  NO_INTERNET: 2001,
} as const

export { ERROR_CODES }

// Variables para exportar
let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let initError: {
  code: string
  name: string
  message: string
  errorCode: number
} | null = null

// Configuración firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
  measurementId: import.meta.env.VITE_measurementId,
}

// Intentar inicializar Firebase
try {
  firebaseApp = initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  db = getFirestore(firebaseApp)
  console.log("✅ Firebase inicializado correctamente")
} catch (error: unknown) {
  console.log("❌ Error initializing Firebase:", error)

  // Type guard para verificar si es un error
  const firebaseError = error as { code?: string; message?: string }

  // Mapear errores
  if (firebaseError?.code === "auth/invalid-api-key") {
    initError = {
      code: "INVALID_API_KEY",
      name: "ERROR DEL SERVIDOR",
      message: "Contacta con el soporte",
      errorCode: ERROR_CODES.INVALID_API_KEY,
    }
  } else if (firebaseError?.code === "auth/invalid-project-id") {
    initError = {
      code: "INVALID_PROJECT",
      name: "ERROR DEL SERVIDOR",
      message: "Contacta con el soporte",
      errorCode: ERROR_CODES.INVALID_PROJECT,
    }
  } else if (firebaseError?.code?.includes("network")) {
    initError = {
      code: "NETWORK_ERROR",
      name: "Sin internet",
      message: "Porfavor conectate a internet",
      errorCode: ERROR_CODES.NETWORK_ERROR,
    }
  } else {
    initError = {
      code: "FIREBASE_ERROR",
      name: "ERROR DEL SERVIDOR",
      message: "Ocurrio un problema inesperado",
      errorCode: ERROR_CODES.FIREBASE_ERROR,
    }
  }
}

// Funciones para exportar
export function isFirebaseReady(): boolean {
  return firebaseApp !== null && auth !== null && db !== null
}

export function getFirebaseError() {
  return initError
}

export function hasFirebaseError(): boolean {
  return initError !== null
}

export function getErrorCode(): number | null {
  return initError?.errorCode || null
}

export function isErrorCode(errorCode: number): boolean {
  return initError?.errorCode === errorCode
}

// Exportar servicios
export { firebaseApp, auth, db }
