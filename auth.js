import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';

import {
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();

// Auth state observer
onAuthStateChanged(window.auth, async (user) => {
  if (user) {
    // User is signed in
    console.log('User signed in:', user.email);
    await loadUserSettings(user.uid);
    showApp();
  } else {
    // User is signed out
    console.log('User signed out');
    showAuthUI();
  }
});

// Sign up with email/password
window.signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      window.auth,
      email,
      password
    );
    await createUserSettings(userCredential.user.uid);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with email/password
window.signInWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(window.auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with Google
window.signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(window.auth, googleProvider);
    const user = result.user;

    // Check if this is a new user
    const userDoc = await getDoc(doc(window.db, 'users', user.uid));
    if (!userDoc.exists()) {
      await createUserSettings(user.uid);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign out
window.signOutUser = async () => {
  try {
    await signOut(window.auth);
    localStorage.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create default user settings in Firestore
async function createUserSettings(uid) {
  const defaultSettings = {
    name: '',
    location: '',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(window.db, 'users', uid), defaultSettings);
}

// Load user settings from Firestore
async function loadUserSettings(uid) {
  try {
    const userDoc = await getDoc(doc(window.db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      localStorage.setItem('userName', data.name || '');
      localStorage.setItem('userLocation', data.location || '');
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
  }
}

// Save user settings to Firestore
window.saveUserSettings = async (name, location) => {
  const user = window.auth.currentUser;
  if (!user) return { success: false, error: 'No user signed in' };

  try {
    await setDoc(
      doc(window.db, 'users', user.uid),
      {
        name: name,
        location: location,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    localStorage.setItem('userName', name);
    localStorage.setItem('userLocation', location);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// UI visibility functions
function showAuthUI() {
  document.getElementById('authModal').style.display = 'flex';
  document.querySelector('.container').style.filter = 'blur(10px)';
}

function showApp() {
  document.getElementById('authModal').style.display = 'none';
  document.querySelector('.container').style.filter = 'none';
}
