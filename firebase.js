<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

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
</script>
