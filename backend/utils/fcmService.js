// Firebase Cloud Messaging service for mobile push notifications
let admin = null;
let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!admin) admin = require('firebase-admin');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
  }
  return firebaseApp;
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.log(`🔔 FCM [MOCK] Token: ${fcmToken ? fcmToken.substring(0, 20) : 'null'}... | Title: ${title} | Body: ${body}`);
    return { messageId: 'MOCK_FCM_' + Date.now() };
  }

  try {
    initFirebase();
    if (!admin) admin = require('firebase-admin');
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } }
    };
    return await admin.messaging().send(message);
  } catch (error) {
    console.error('FCM send error:', error.message);
  }
};

module.exports = { sendPushNotification, initFirebase };
