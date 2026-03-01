import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey:            "AIzaSyDk3x0IZPTzCXEwWBykNdofS5h9fN1vHW4",
  authDomain:        "jupiterdecisionengine.firebaseapp.com",
  projectId:         "jupiterdecisionengine",
  storageBucket:     "jupiterdecisionengine.firebasestorage.app",
  messagingSenderId: "544314726396",
  appId:             "1:544314726396:web:f7d80ae7dcdc7af05dc479",
};

export const app = initializeApp(firebaseConfig);
