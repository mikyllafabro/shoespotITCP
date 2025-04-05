# Firebase Security Rules

## Completely Open Rules (For Development Only)

Use these fully permissive rules during development to fix the permission errors:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all read and write operations
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Storage Rules (if using Firebase Storage)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow all read and write operations
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## How to Apply These Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (shoespotdb)
3. Navigate to Firestore Database > Rules
4. Copy and paste the Firestore rules
5. Click "Publish"
6. If using Storage, go to Storage > Rules and update those as well
