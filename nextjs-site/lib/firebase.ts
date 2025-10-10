import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCwVnyj4j9vVEu88BXKxd6-4sNa-mkduVI",
  authDomain: "ask-me-anything-voidash.firebaseapp.com",
  projectId: "ask-me-anything-voidash",
  storageBucket: "ask-me-anything-voidash.firebasestorage.app",
  messagingSenderId: "695897255699",
  appId: "1:695897255699:web:fef029a271b72ee38f74e6",
  measurementId: "G-43LRB0V3BW"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }
