<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCWr-o2ndTgdKS98f1n1mcsHbjTWZzgBGE",
    authDomain: "stationsdb-cd5a1.firebaseapp.com",
    projectId: "stationsdb-cd5a1",
    storageBucket: "stationsdb-cd5a1.firebasestorage.app",
    messagingSenderId: "73361234514",
    appId: "1:73361234514:web:ecf88fa6e327c3c2601d8b",
    measurementId: "G-YGPZ42BTJ1"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getFirestore(app);
  const auth = getAuth(app);

  export { db, auth };
</script>
