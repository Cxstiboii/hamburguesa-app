const firebaseConfig = {
  apiKey: "AIzaSyDfpvqJ_sRUxEnK4qmi86abddJ6IHNcWCY",
  authDomain: "hamburguesas-turnos.firebaseapp.com",
  databaseURL: "https://hamburguesas-turnos-default-rtdb.firebaseio.com",
  projectId: "hamburguesas-turnos",
  storageBucket: "hamburguesas-turnos.firebasestorage.app",
  messagingSenderId: "785436685004",
  appId: "1:785436685004:web:410b7769c0237c034d4869"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
