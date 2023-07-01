import { initializeApp } from 'firebase/app'
import { collection, addDoc, getFirestore } from "firebase/firestore";

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

async function testFirestore() {
  try {
    const docRef = await addDoc(collection(firestoreDB, "users"), {
      first: "Ada",
      last: "Lovelace",
      born: 1815
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export { testFirestore }