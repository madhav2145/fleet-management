import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './firebaseConfig';

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  module: 'module_1' | 'module_2' | 'module_3';
}

export const signUp = async (email: string, password: string, module: 'module_1' | 'module_2' | 'module_3'): Promise<{ email: string }> => {
  try {
    console.log('Attempting to sign up user:', { email, module }); 

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      const userData = {
        email: user.email!,
        role: 'user',
        module, 
      };

      console.log('Saving user data to Firestore:', userData);
      await setDoc(doc(firestore, 'users', user.uid), userData);
      console.log('User successfully signed up:', userData); 

      // Return the user email
      return { email: user.email! };
    } else {
      throw new Error('User creation failed');
    }
  } catch (error) {
    console.error('Error during sign-up:', error); 
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
    }
    throw new Error('User not found');
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};


