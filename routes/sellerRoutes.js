const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

router.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        return res.redirect('/login?userType=seller');
    }
    res.render('sellerDashboard', { title: 'Seller Dashboard', user: req.user });
});

module.exports = router;
