import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { collection, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const firebaseEnabled = Object.values(config).every(Boolean);
const apiBase = import.meta.env.VITE_API_URL || '';
let db = null;
let auth = null;

const cloud = {
  enabled: firebaseEnabled,
  user: null,
  async save(collectionName, id, value) {
    if (!db) return;
    await setDoc(doc(db, collectionName, id), { ...value, updatedAt: Date.now() }, { merge: true });
  },
  async saveProducts(products) {
    if (db) await Promise.all(products.map(product => this.save('products', product.id, product)));
    fetch(`${apiBase}/api/cache/products`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products }) }).catch(() => {});
  },
  async loadProducts() {
    if (!db) return;
    const snapshot = await getDocs(collection(db, 'products'));
    if (!snapshot.empty) {
      const products = snapshot.docs.map(item => item.data());
      localStorage.setItem('baati-products', JSON.stringify(products));
      window.dispatchEvent(new Event('baati-cloud-products'));
    }
  },
  async signIn() {
    if (!auth) return null;
    return signInWithPopup(auth, new GoogleAuthProvider());
  },
  async signInEmail(email, password) {
    if (!auth) return null;
    return signInWithEmailAndPassword(auth, email, password);
  },
  async signOut() {
    if (auth) await signOut(auth);
  }
};

if (firebaseEnabled) {
  const app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
  if (config.measurementId) isSupported().then(supported => { if (supported) getAnalytics(app); }).catch(() => {});
  onAuthStateChanged(auth, user => { cloud.user = user; window.dispatchEvent(new CustomEvent('baati-auth-changed', { detail: user })); });
  cloud.loadProducts().catch(error => console.warn('Firebase product sync unavailable:', error));
}

window.BaatiCloud = cloud;
window.dispatchEvent(new CustomEvent('baati-cloud-ready', { detail: cloud }));
