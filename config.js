import firebase from 'firebase/app'
require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyCRf33Ft7ZZckSNc2pEZ5FAJBUSpluFGI8",
    authDomain: "wireless-library-37658.firebaseapp.com",
    projectId: "wireless-library-37658",
    storageBucket: "wireless-library-37658.appspot.com",
    messagingSenderId: "280323666051",
    appId: "1:280323666051:web:1ad3c2bb181f141f5c6bb6"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore();