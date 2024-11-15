// lib/auth.js
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Add this function to your auth.js
export const logoutUser  = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message); // Handle errors
  }
};

// Add this function to your auth.js
export const loginUser  = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user; // Return the user object
  } catch (error) {
    throw new Error(error.message); // Handle errors
  }
};

export const registerUser  = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date(),
    });
    
    return user; // Return the user object
  } catch (error) {
    throw new Error(error.message); // Handle errors
  }
};