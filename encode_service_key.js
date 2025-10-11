// const fs = require('fs');
// const key = fs.readFileSync("./modern-hotel-booking-firebase-admin-key.json", 'utf8')

// const base64Key = Buffer.from(key,'utf8').toString('base64')
// console.log(base64Key);


// encode_service_key.js
const fs = require("fs");
const path = require("path");

// Path to your Firebase key
const keyPath = path.join(__dirname, "modern-hotel-booking-firebase-admin-key.json");

// 1️⃣ Read the JSON file
const key = fs.readFileSync(keyPath, "utf8");

// 2️⃣ Encode in Base64
const base64Key = Buffer.from(key, "utf8").toString("base64");

// 3️⃣ Prepare the .env entry
const envLine = `FIREBASE_SERVICE_ACCOUNT=${base64Key}\n`;

// 4️⃣ Append or update .env file
const envPath = path.join(__dirname, ".env");

// Check if .env exists
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envLine);
  console.log("✅ .env file created with FIREBASE_SERVICE_ACCOUNT");
} else {
  let envContent = fs.readFileSync(envPath, "utf8");

  if (envContent.includes("FIREBASE_SERVICE_ACCOUNT=")) {
    // Replace old value
    envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT=.*/, envLine.trim());
  } else {
    // Append if not found
    envContent += `\n${envLine}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ FIREBASE_SERVICE_ACCOUNT updated in .env");
}

console.log("🎉 Firebase key encoded successfully!");
