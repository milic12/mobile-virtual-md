import { initializeApp } from "firebase/app";
//@ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDXWSeSXAkBOpUfaNyN9G1171AJrWhHiqk",
  authDomain: "VirtualMDaivideoandchat.firebaseapp.com",
  databaseURL: "https://VirtualMDaivideoandchat-default-rtdb.firebaseio.com",
  projectId: "VirtualMDaivideoandchat",
  storageBucket: "VirtualMDaivideoandchat.firebasestorage.app",
  messagingSenderId: "221638964524",
  appId: "1:221638964524:web:f6d8163bf8048043daa889",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
