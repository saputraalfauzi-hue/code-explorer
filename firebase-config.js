const firebaseConfig = {
    apiKey: "AIzaSyCUqgAA2e__tiaQjQuRRZcQTsLIM5JC1nI",
    authDomain: "marketplacesj-d0767.firebaseapp.com",
    projectId: "marketplacesj-d0767",
    storageBucket: "marketplacesj-d0767.firebasestorage.app",
    messagingSenderId: "443129735278",
    appId: "1:443129735278:web:db6191a42628bf47fc5e7f",
    measurementId: "G-BDWGEB9T5T"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();