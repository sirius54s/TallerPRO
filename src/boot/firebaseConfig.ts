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
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
}

// Función para validar configuración
function validateFirebaseConfig(): boolean {
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ]

  for (const field of requiredFields) {
    if (!firebaseConfig[field as keyof typeof firebaseConfig]) {
      console.error(`❌ Missing Firebase config: ${field}`)
      return false
    }
  }
  return true
}

// Función para mapear errores correctamente
function mapFirebaseError(error: unknown) {
  const firebaseError = error as {
    code?: string
    message?: string
    name?: string
  }

  console.error("Firebase Error Details:", {
    code: firebaseError?.code,
    message: firebaseError?.message,
    name: firebaseError?.name,
  })

  // Mapear errores de inicialización correctamente
  if (
    firebaseError?.message?.includes("API key not valid") ||
    firebaseError?.code === "app/invalid-api-key"
  ) {
    return {
      code: "INVALID_API_KEY",
      name: "ERROR DEL SERVIDOR",
      message: "Contacta con el soporte",
      errorCode: ERROR_CODES.INVALID_API_KEY,
    }
  }

  if (
    firebaseError?.message?.includes("Project ID") ||
    firebaseError?.code === "app/invalid-project-id"
  ) {
    return {
      code: "INVALID_PROJECT",
      name: "ERROR DEL SERVIDOR",
      message: "Contacta con el soporte",
      errorCode: ERROR_CODES.INVALID_PROJECT,
    }
  }

  if (
    firebaseError?.message?.includes("network") ||
    firebaseError?.message?.includes("fetch") ||
    firebaseError?.name === "NetworkError"
  ) {
    return {
      code: "NETWORK_ERROR",
      name: "Sin internet",
      message: "Por favor conéctate a internet",
      errorCode: ERROR_CODES.NETWORK_ERROR,
    }
  }

  // Error genérico
  return {
    code: "FIREBASE_ERROR",
    name: "ERROR DEL SERVIDOR",
    message: "Ocurrió un problema inesperado",
    errorCode: ERROR_CODES.FIREBASE_ERROR,
  }
}

// Intentar inicializar Firebase
try {
  // Primero validar que tenemos toda la configuración
  if (!validateFirebaseConfig()) {
    throw new Error("Missing required Firebase configuration")
  }

  console.log("🔥 Iniciando Firebase con configuración:", {
    hasApiKey: !!firebaseConfig.apiKey,
    apiKeyLength: firebaseConfig.apiKey?.length || 0,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  })

  firebaseApp = initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  db = getFirestore(firebaseApp)

  console.log("✅ Firebase inicializado correctamente")
} catch (error: unknown) {
  console.error("❌ Error initializing Firebase:", error)
  initError = mapFirebaseError(error)
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
