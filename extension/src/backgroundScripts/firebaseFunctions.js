import { initializeApp } from 'firebase/app'
import { collection, doc, addDoc, setDoc, getFirestore, updateDoc, arrayUnion } from "firebase/firestore";

import { getBlocklist } from './extensionFunctions';

const firebaseConfig = {
  apiKey: "AIzaSyBDk-Ka0TLAnv-ECaYb5BfjVkjg8a9wMdU",
  authDomain: "klaus-68019.firebaseapp.com",
  projectId: "klaus-68019",
  storageBucket: "klaus-68019.appspot.com",
  messagingSenderId: "484199233773",
  appId: "1:484199233773:web:c199ddf001704d4ed334e4",
  measurementId: "G-PF3DJD5GB0"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDB = getFirestore(firebaseApp); //firestore database

const testUserID = "testUser1"
const userDocRef = doc(firestoreDB, "users", testUserID);

async function testFirestore() {
  try {
    await setDoc(doc(firestoreDB, "users", testUserID), {
      first: "Viet",
      last: "Ngomai",
      email: "thienvietngomai@gmail.com",
      blocklist: [],
      whitelist: [],
    },{ merge: true });
    console.log("Document written with ID: ", userDocRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function saveBlocklistToFirestore(blocklist) {
  try {
    await updateDoc(userDocRef, {
      blocklist: blocklist
    })
    console.log("Blocklist updated to firestore")
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export { testFirestore, saveBlocklistToFirestore }