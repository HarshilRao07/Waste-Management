const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Buyer Dashboard
router.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }
    res.render('buyerDashboard', { title: 'Buyer Dashboard', user: req.user });
});

// Buyer Inventory
router.get('/inventory', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    try {
        const db = req.app.locals.db;
        const uploads = await db.collection('uploads').aggregate([
            {
                $lookup: {
                    from: 'sellers',
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            {
                $unwind: '$sellerInfo'
            }
        ]).toArray();
        res.render('inventory', { title: 'Inventory', user: req.user, uploads });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching inventory');
    }
});

// GET route for detailed view of an inventory item
router.get('/inventory/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    const itemId = req.params.id;
    try {
        const db = req.app.locals.db;
        const item = await db.collection('uploads').findOne({ _id: new ObjectId(itemId) });

        if (item) {
            res.render('inventoryDetail', { title: 'Inventory Details', user: req.user, item });
        } else {
            res.status(404).send('Item not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching item details');
    }
});


// POST route for requesting an item
router.post('/request', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    const { itemId, quantity } = req.body;

    try {
        const db = req.app.locals.db;
        const item = await db.collection('uploads').findOne({ _id: new ObjectId(itemId) });

        if (!item) {
            return res.status(404).send('Item not found');
        }

        // Create a request document
        const request = {
            buyerId: req.user._id,
            sellerId: item.sellerId,
            itemId: new ObjectId(itemId),
            quantity: parseInt(quantity),
            status: 'Pending',
            createdAt: new Date()
        };

        // Insert the request into the 'requests' collection
        await db.collection('requests').insertOne(request);

        res.redirect('/buyer/inventory'); // Redirect back to the inventory page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting request');
    }
});

// GET route for displaying the buyer requests page
router.get('/request', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    try {
        const db = req.app.locals.db;
        const requests = await db.collection('requests').find({ buyerId: req.user._id }).toArray();
        
        // Fetch additional details for each request
        const detailedRequests = await Promise.all(requests.map(async (request) => {
            const item = await db.collection('uploads').findOne({ _id: request.itemId });
            const seller = await db.collection('sellers').findOne({ _id: request.sellerId });
            return {
                ...request,
                item,
                sellerName: seller ? seller.username : 'Unknown Seller'
            };
        }));

        res.render('buyerRequest', { title: 'Buyer Requests', user: req.user, requests: detailedRequests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching requests');
    }
});

// GET route for editing buyer requests
router.get('/editing', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    try {
        const db = req.app.locals.db;
        const requests = await db.collection('requests').find({ buyerId: req.user._id }).toArray();

        // Fetch additional details for each request
        const detailedRequests = await Promise.all(requests.map(async (request) => {
            const item = await db.collection('uploads').findOne({ _id: request.itemId });
            return {
                ...request,
                item
            };
        }));

        res.render('buyerEditing', { title: 'Edit Requests', user: req.user, requests: detailedRequests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching requests');
    }
});


// GET route for editing a request
// GET route for editing a request
router.get('/editRequest/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    const requestId = req.params.id;
    try {
        const db = req.app.locals.db;
        const request = await db.collection('requests').findOne({ _id: new ObjectId(requestId), buyerId: req.user._id });

        if (!request) {
            return res.status(404).send('Request not found');
        }

        const item = await db.collection('uploads').findOne({ _id: request.itemId });

        res.render('editRequest', { title: 'Edit Request', user: req.user, request, item });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching request details');
    }
});


// POST route for updating a request
router.post('/updateRequest', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    const { requestId, quantity } = req.body;

    try {
        const db = req.app.locals.db;
        await db.collection('requests').updateOne(
            { _id: new ObjectId(requestId), buyerId: req.user._id },
            { $set: { quantity: parseInt(quantity) } }
        );

        res.redirect('/buyer/request');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating request');
    }
});

// POST route for cancelling a request
router.post('/cancelRequest', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }

    const { requestId } = req.body;

    try {
        const db = req.app.locals.db;
        await db.collection('requests').deleteOne({ _id: new ObjectId(requestId), buyerId: req.user._id });

        res.redirect('/buyer/request');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error cancelling request');
    }
});

module.exports = router;
