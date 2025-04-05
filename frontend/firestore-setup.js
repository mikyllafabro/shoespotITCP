// Firestore setup and admin functions
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Sets up Firestore with an initial setup including sample data and admin users
 */
export const setupFirestore = async (adminEmails = ['your-admin-email@example.com']) => {
  console.log('Setting up Firestore with initial data...');
  
  try {
    // Create admin collection settings doc if it doesn't exist
    const settingsRef = doc(db, "settings", "permissions");
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      await setDoc(settingsRef, {
        adminEmails: adminEmails,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Created settings/permissions document');
    } else {
      console.log('Settings document already exists');
    }
    
    // Create public security rules doc
    const rulesRef = doc(db, "settings", "securityRules");
    await setDoc(rulesRef, {
      allowPublicRead: true,
      allowUserRegistration: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('Firestore setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up Firestore:', error);
    return false;
  }
};

/**
 * Adds an email to the admin list
 */
export const addAdminEmail = async (email) => {
  if (!email) return false;
  
  try {
    const settingsRef = doc(db, "settings", "permissions");
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      const adminEmails = Array.isArray(data.adminEmails) ? data.adminEmails : [];
      
      if (!adminEmails.includes(email)) {
        adminEmails.push(email);
        await setDoc(settingsRef, {
          adminEmails,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`Added ${email} to admin list`);
      } else {
        console.log(`${email} is already an admin`);
      }
      return true;
    } else {
      await setupFirestore([email]);
      return true;
    }
  } catch (error) {
    console.error('Error adding admin email:', error);
    return false;
  }
};
