const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');

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

// GET route for displaying the editing page
router.get('/editing', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }

    try {
        const db = req.app.locals.db;
        const uploads = await db.collection('uploads').find({ sellerId: req.user._id }).toArray();
        res.render('editing', { title: 'Editing', user: req.user, uploads });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching uploads');
    }
});

// GET route for editing an upload
router.get('/edit/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }

    try {
        const db = req.app.locals.db;
        const upload = await db.collection('uploads').findOne({ _id: new ObjectId(req.params.id) });
        if (!upload) {
            return res.status(404).send('Upload not found');
        }
        res.render('editUpload', { title: 'Edit Upload', user: req.user, upload });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching upload for editing');
    }
});

// POST route for updating an upload
router.post('/edit/:id', upload, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }

    const { location, contact, quantity, details, category } = req.body;
    const imageFile = req.file;

    try {
        const db = req.app.locals.db;
        const updateData = {
            location,
            contact,
            quantity: parseInt(quantity),
            details,
            category,
            updatedAt: new Date()
        };

        if (imageFile) {
            updateData.image = {
                filename: imageFile.filename,
                path: imageFile.path,
                originalname: imageFile.originalname,
                mimetype: imageFile.mimetype,
                size: imageFile.size
            };
        }

        await db.collection('uploads').updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData });

        res.redirect('/seller/editing');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating upload');
    }
});

// GET route for deleting an upload
router.get('/delete/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }

    try {
        const db = req.app.locals.db;
        const upload = await db.collection('uploads').findOne({ _id: new ObjectId(req.params.id) });
        if (!upload) {
            return res.status(404).send('Upload not found');
        }

        // Delete the image file from the server
        fs.unlink(path.join(__dirname, '..', 'public', 'uploads', upload.image.filename), async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error deleting file');
            }

            // Delete the upload from the database
            await db.collection('uploads').deleteOne({ _id: new ObjectId(req.params.id) });

            res.redirect('/seller/editing');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting upload');
    }
});

// GET route for rendering the awards page
router.get('/awards', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }
    res.render('awards', { title: 'Awards', user: req.user });
});


module.exports = router;
