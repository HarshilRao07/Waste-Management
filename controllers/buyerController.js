module.exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const db = req.app.locals.db;
        await db.collection('buyers').insertOne({ username, email, password });
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering buyer");
    }
};
