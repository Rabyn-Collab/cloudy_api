import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./data.json');
const app = express();


initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://bookapp-e6672.firebaseio.com"
});

export const auth = getAuth();
export const db = getFirestore();
export const rtdb = getDatabase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Cloudinary config
cloudinary.config({
  cloud_name: "dx5eyrlaf",
  api_key: "758723229849332",
  api_secret: "FhUYAxbzkI4Mxm0yLx0W2A9R9zo",
});

// Health check
app.get("/", (req, res) => {
  return res.status(200).json({ message: "API is running" });
});

// Upload file
app.post("/api/files", async (req, res) => {
  try {
    const file = req.files?.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const result = await cloudinary.uploader.upload(file.tempFilePath);
    return res.status(200).json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "File upload failed" });
  }
});

// Update file (replace)
app.patch("/api/files/:public_id", async (req, res) => {
  const { public_id } = req.params;
  try {
    const file = req.files?.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    await cloudinary.uploader.destroy(public_id);

    const result = await cloudinary.uploader.upload(file.tempFilePath);
    return res.status(200).json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    return res.status(500).json({ error: "File update failed" });
  }
});

// Delete file
app.delete("/api/files/:public_id", async (req, res) => {
  const { public_id } = req.params;
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result === "ok") {
      return res.status(200).json({ message: "File deleted successfully" });
    } else {
      return res.status(404).json({ error: "File not found or already deleted" });
    }
  } catch (error) {
    return res.status(500).json({ error: "File deletion failed" });
  }
});




app.delete('/api/users/:uid', async (req, res) => {
  const uid = req.params.uid;
  try {
    // Delete from Firebase Authentication
    await auth.deleteUser(uid);
    console.log(`✅ Successfully deleted user: ${uid}`);

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();
    console.log('✅ Deleted user document from Firestore');

    // Delete from Realtime Database
    await rtdb.ref(`users/${uid}`).remove();
    console.log('✅ Deleted user data from Realtime Database');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }

});








// Start server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});


