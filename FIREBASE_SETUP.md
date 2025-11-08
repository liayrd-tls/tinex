# Firebase Setup Guide

Your Firebase project is configured, but you need to enable authentication methods.

## Current Firebase Config

```
Project ID: tinex-fd2b6
Auth Domain: tinex-fd2b6.firebaseapp.com
```

## Step 1: Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/project/tinex-fd2b6)
2. Click **Authentication** in the left sidebar
3. Click **Get Started** (if first time)
4. Go to **Sign-in method** tab

### Enable Email/Password Authentication

1. Click on **Email/Password**
2. Toggle **Enable** switch
3. Click **Save**

### Enable Google Sign-In

1. Click on **Google**
2. Toggle **Enable** switch
3. Add your project support email
4. Click **Save**

## Step 2: Set Up Firestore Database

1. Go to **Firestore Database** in the sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your region (closest to your users)
5. Click **Enable**

### Add Security Rules (Production)

Once you're ready for production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /categories/{categoryId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /budgets/{budgetId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /importSources/{sourceId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /importJobs/{jobId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Step 3: Set Up Storage

1. Go to **Storage** in the sidebar
2. Click **Get started**
3. Start in **test mode** (for development)
4. Click **Done**

### Storage Rules (Production)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/imports/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4: Verify Configuration

Your app is already configured with these credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCJ9ZQAvHYtKs-37fA6jXtCah2bBrhBPS8",
  authDomain: "tinex-fd2b6.firebaseapp.com",
  projectId: "tinex-fd2b6",
  storageBucket: "tinex-fd2b6.firebasestorage.app",
  messagingSenderId: "417161639080",
  appId: "1:417161639080:web:3ea342c4f102d814703e9d",
  measurementId: "G-BYMWSYMH8Z"
};
```

## Step 5: Test Authentication

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/auth

3. Try signing up with email/password

4. Try signing in with Google

## Troubleshooting

### "auth/operation-not-allowed" Error
- Make sure Email/Password and Google sign-in are enabled in Firebase Console
- Check Authentication > Sign-in method tab

### "Unauthorized domain" Error
- Go to Authentication > Settings > Authorized domains
- Add `localhost` for development
- Add your production domain when deploying

### Firestore Permission Denied
- Make sure you started in **test mode**
- Or update security rules to allow authenticated access

## Environment Variables (Optional)

For security best practices, you can also use environment variables:

Create `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCJ9ZQAvHYtKs-37fA6jXtCah2bBrhBPS8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tinex-fd2b6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tinex-fd2b6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tinex-fd2b6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=417161639080
NEXT_PUBLIC_FIREBASE_APP_ID=1:417161639080:web:3ea342c4f102d814703e9d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-BYMWSYMH8Z
```

The app will use these environment variables if present, or fall back to the hardcoded values.

## Next Steps

Once Firebase is configured:
1. Test authentication at /auth
2. Access the dashboard at /dashboard
3. Start implementing transaction features
4. Add CSV import functionality
5. Build charts and analytics

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage](https://firebase.google.com/docs/storage)
