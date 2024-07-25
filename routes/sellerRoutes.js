const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sellerController = require('../controllers/sellerController');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

router.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }
    res.render('sellerDashboard', { title: 'Seller Dashboard', user: req.user });
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Use the uploadsDir variable
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // File naming format
    }
});

// Multer upload initialization
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limit file size to 5MB (adjust as needed)
    },
    fileFilter: function (req, file, cb) {
        // Allowed file extensions
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only! (jpeg, jpg, png)', false);
        }
    }
}).single('image'); // 'image' should match the name attribute in your form input for file upload

// GET route for rendering the upload form
router.get('/upload', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }
    res.render('upload', { title: 'Upload Waste', user: req.user });
});

// POST route for handling upload form submission
router.post('/upload', upload, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }

    const { location, contact, quantity, details, category } = req.body;
    const imageFile = req.file; // File upload details from multer

    try {
        const db = req.app.locals.db;
        // Save uploaded data to MongoDB
        await db.collection('uploads').insertOne({
            location,
            contact,
            quantity: parseInt(quantity),
            details,
            category,
            image: {
                filename: imageFile.filename,
                path: imageFile.path,
                originalname: imageFile.originalname,
                mimetype: imageFile.mimetype,
                size: imageFile.size
            },
            createdAt: new Date(),
            sellerId: req.user._id // Optional: Link upload to the seller
        });

        // Render the success page
        res.render('uploadSuccess', { title: 'Upload Successful', user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error uploading waste');
    }
});


module.exports = router;
