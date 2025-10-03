import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBnbswPJogi8BHEemJ5dj-38KChGAzJFnM",
    authDomain: "ue-connect.firebaseapp.com",
    projectId: "ue-connect",
    storageBucket: "ue-connect.appspot.com",
    messagingSenderId: "761554615717",
    appId: "1:761554615717:web:2d1597a661824a8d577c4c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };