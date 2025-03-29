const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "shoespotdb", 
  databaseURL: 'https://shoespotdb-default-rtdb.asia-southeast1.firebasedatabase.app/', // Replace with your actual database URL
});

const db = admin.firestore();

module.exports = { admin, db };