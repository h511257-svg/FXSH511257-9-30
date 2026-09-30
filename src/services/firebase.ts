import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  INITIAL_PRODUCTS,
  INITIAL_STUDENTS,
  INITIAL_PROMOTIONS,
  INITIAL_DAILY_SUMMARIES,
  INITIAL_TRANSACTIONS
} from '../data/initialData';
import { Product, StudentMember, Promotion, DailySummary, SaleTransaction } from '../types/store';
import { getProductBarcode } from '../utils/barcodeUtils';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (supporting named database if defined in config)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Seed Initial Data to Firebase if collections are empty
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const productsColl = collection(db, 'products');
    const snap = await getDocs(productsColl);

    if (snap.empty) {
      console.log('Seeding initial welfare store data into Firestore...');
      const batch = writeBatch(db);

      // Seed Products
      INITIAL_PRODUCTS.forEach(p => {
        const d = doc(db, 'products', p.id);
        batch.set(d, p);
      });

      // Seed Students
      INITIAL_STUDENTS.forEach(s => {
        const d = doc(db, 'students', s.studentId);
        batch.set(d, s);
      });

      // Seed Promotions
      INITIAL_PROMOTIONS.forEach(promo => {
        const d = doc(db, 'promotions', promo.id);
        batch.set(d, promo);
      });

      // Seed Daily Summaries
      INITIAL_DAILY_SUMMARIES.forEach((sum, idx) => {
        const d = doc(db, 'daily_summaries', `summary-${idx}`);
        batch.set(d, sum);
      });

      // Seed Transactions
      INITIAL_TRANSACTIONS.forEach(t => {
        const d = doc(db, 'transactions', t.id);
        batch.set(d, t);
      });

      await batch.commit();
      console.log('Firebase seeding complete.');
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Firebase seed check/write error (falling back to local memory):', err);
    return false;
  }
}

// Fetch all collections from Firebase
export async function fetchStoreDataFromFirebase(): Promise<{
  products: Product[];
  students: StudentMember[];
  promotions: Promotion[];
  dailySummaries: DailySummary[];
  transactions: SaleTransaction[];
} | null> {
  try {
    const [pSnap, sSnap, prSnap, dSnap, tSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'promotions')),
      getDocs(collection(db, 'daily_summaries')),
      getDocs(collection(db, 'transactions'))
    ]);

    if (pSnap.empty && sSnap.empty) {
      return null;
    }

    let needsBarcodeSync = false;
    const products = pSnap.docs.map(d => {
      const raw = d.data() as Product;
      if (!raw.barcode) {
        needsBarcodeSync = true;
      }
      return {
        ...raw,
        barcode: getProductBarcode(raw)
      };
    });
    const students = sSnap.docs.map(d => d.data() as StudentMember);
    const promotions = prSnap.docs.map(d => d.data() as Promotion);
    const dailySummaries = dSnap.docs.map(d => d.data() as DailySummary);
    const transactions = tSnap.docs.map(d => d.data() as SaleTransaction);

    // Automatically push barcode enrichment to Firestore if any product lacked barcode
    if (needsBarcodeSync && products.length > 0) {
      const batch = writeBatch(db);
      products.forEach(p => {
        batch.set(doc(db, 'products', p.id), p);
      });
      batch.commit().catch(e => console.warn('Auto barcode sync warning:', e));
    }

    return {
      products: products.length > 0 ? products : INITIAL_PRODUCTS,
      students: students.length > 0 ? students : INITIAL_STUDENTS,
      promotions: promotions.length > 0 ? promotions : INITIAL_PROMOTIONS,
      dailySummaries: dailySummaries.length > 0 ? dailySummaries : INITIAL_DAILY_SUMMARIES,
      transactions: transactions.length > 0 ? transactions : INITIAL_TRANSACTIONS
    };
  } catch (err) {
    console.warn('Error reading from Firebase Firestore:', err);
    return null;
  }
}

// Write-through helper functions
export async function saveProductToFirebase(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (e) {
    console.warn('Firebase saveProduct error:', e);
  }
}

export async function saveStudentToFirebase(student: StudentMember): Promise<void> {
  try {
    await setDoc(doc(db, 'students', student.studentId), student);
  } catch (e) {
    console.warn('Firebase saveStudent error:', e);
  }
}

export async function saveTransactionToFirebase(txn: SaleTransaction): Promise<void> {
  try {
    await setDoc(doc(db, 'transactions', txn.id), txn);
  } catch (e) {
    console.warn('Firebase saveTransaction error:', e);
  }
}

export async function savePromotionToFirebase(promo: Promotion): Promise<void> {
  try {
    await setDoc(doc(db, 'promotions', promo.id), promo);
  } catch (e) {
    console.warn('Firebase savePromotion error:', e);
  }
}

// Bulk sync all local state directly into Firestore
export async function syncAllStoreDataToFirebase(data: {
  products: Product[];
  students: StudentMember[];
  promotions: Promotion[];
  dailySummaries: DailySummary[];
  transactions: SaleTransaction[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const batch = writeBatch(db);
    let count = 0;

    data.products.forEach(p => {
      batch.set(doc(db, 'products', p.id), p);
      count++;
    });

    data.students.forEach(s => {
      batch.set(doc(db, 'students', s.studentId), s);
      count++;
    });

    data.promotions.forEach(promo => {
      batch.set(doc(db, 'promotions', promo.id), promo);
      count++;
    });

    data.dailySummaries.forEach((sum, idx) => {
      batch.set(doc(db, 'daily_summaries', `summary-${idx}`), sum);
      count++;
    });

    data.transactions.forEach(t => {
      batch.set(doc(db, 'transactions', t.id), t);
      count++;
    });

    await batch.commit();
    return { success: true, count };
  } catch (err: any) {
    console.error('Error syncing all data to Firebase:', err);
    return { success: false, count: 0, error: err?.message || 'Firebase 同步失敗' };
  }
}
