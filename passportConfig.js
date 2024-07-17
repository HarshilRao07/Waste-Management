const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

module.exports = function (app, db) {
    const passport = require('passport');

    passport.use('buyer-local', new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = await db.collection('buyers').findOne({ email: email });
                if (!user) {
                    return done(null, false, { message: 'Incorrect email.' });
                }
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                user.role = 'buyer'; // Add role information to user object
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    passport.use('seller-local', new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = await db.collection('sellers').findOne({ email: email });
                if (!user) {
                    return done(null, false, { message: 'Incorrect email.' });
                }
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                user.role = 'seller'; // Add role information to user object
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, { id: user._id, userType: user.role });
    });

    passport.deserializeUser(async (obj, done) => {
        console.log('Deserializing user:', obj);
        try {
            const collection = obj.userType === 'seller' ? 'sellers' : 'buyers';
            const user = await db.collection(collection).findOne({ _id: new ObjectId(obj.id) });
            console.log('User deserialized:', user);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
