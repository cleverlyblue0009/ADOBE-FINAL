# 🔐 Authentication Setup Guide

This guide will help you set up Google and LinkedIn OAuth authentication for your DocuSense application using Firebase.

## 🚀 Quick Start

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Give your project a name (e.g., "docusense-auth")
4. Follow the setup wizard

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to the **Sign-in method** tab

### 3. Enable Google Sign-in

1. Click on **Google** in the providers list
2. Click **Enable**
3. Add your **Project support email**
4. Click **Save**

### 4. Enable LinkedIn Sign-in

1. Click on **LinkedIn** in the providers list
2. Click **Enable**
3. You'll need to create a LinkedIn app first (see LinkedIn App Setup below)
4. Add your **Client ID** and **Client Secret**
5. Click **Save**

### 5. Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click **Add app** and choose **Web**
5. Give your app a nickname (e.g., "DocuSense Web")
6. Copy the configuration values

### 6. Configure Environment Variables

1. Create a `.env` file in your project root
2. Copy the values from `firebase-config.example` and replace with your actual values:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🔗 LinkedIn App Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **Create App**
3. Fill in the required information:
   - App name: "DocuSense"
   - LinkedIn Page: Your company page
   - App Logo: Upload your app logo
4. Click **Create App**

### 2. Configure OAuth 2.0 Settings

1. In your LinkedIn app, go to **Auth** tab
2. Add these **Authorized redirect URLs**:
   - `https://your-domain.com/__/auth/handler`
   - `http://localhost:8080/__/auth/handler` (for development)
3. Copy your **Client ID** and **Client Secret**

### 3. Request API Access

1. Go to **Products** tab
2. Request access to **Sign In with LinkedIn**
3. Wait for approval (usually takes 1-2 business days)

## 🧪 Testing the Authentication

### 1. Start the Application

```bash
npm run dev
```

### 2. Test Sign-in

1. Open your app in the browser
2. You should see the login page
3. Try signing in with Google
4. Try signing in with LinkedIn

### 3. Test Guest Mode

1. On the login page, click "Continue as Guest"
2. You'll be redirected to the main app with limited access
3. A yellow banner will indicate you're in guest mode
4. User profile will show "Guest" with limited options

### 4. Check Authentication State

- The app will redirect unauthenticated users to the login page
- Authenticated users will see the main application
- Guest users can access the app with limited features
- User profile dropdown will show in the top-right corner

## 🔧 Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to Firebase Console > Authentication > Settings > Authorized domains

2. **"LinkedIn OAuth error"**
   - Check if your LinkedIn app is approved
   - Verify redirect URLs match exactly
   - Ensure Client ID and Secret are correct

3. **"Google OAuth error"**
   - Verify Google Sign-in is enabled in Firebase
   - Check if you're using the correct Firebase config

### Debug Mode

Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'firebase:*');
```

## 📱 Features

- ✅ **Google OAuth** - Sign in with Google account
- ✅ **LinkedIn OAuth** - Sign in with LinkedIn account
- ✅ **Guest Mode** - Use the app without signing in (limited features)
- ✅ **Protected Routes** - Unauthenticated users can't access the app
- ✅ **User Profile** - Shows user info and logout option
- ✅ **Persistent Auth** - Users stay logged in across sessions
- ✅ **Beautiful UI** - Modern, responsive login page
- ✅ **Error Handling** - Clear error messages for failed sign-ins
- ✅ **Guest Mode Banner** - Clear indication when using limited features

## 🚀 Next Steps

After setting up authentication, you can:

1. **Add User Management** - Store user preferences and settings
2. **Implement Role-Based Access** - Different features for different user types
3. **Add Email/Password Auth** - Traditional login method
4. **Social Features** - User profiles, sharing, collaboration
5. **Analytics** - Track user engagement and feature usage

## 📚 Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [LinkedIn OAuth Documentation](https://developer.linkedin.com/docs/oauth2)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Need help?** Check the Firebase Console logs or create an issue in your project repository. 