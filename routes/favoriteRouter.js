const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id }) //*Check if user has associated "favorites" document. This line was provided in the instructions.
    .populate('user') //* Chained method from Mongoose Populate to retrieve data from the associated "user" document.
    .populate('campsites') //* Chained method from Mongoose Populate to retrieve data from the associated "campsites" document.
    .then(favorites => { //* Takes the promise returned from .find() and places the retrieved favorites document in this "favorite" variable.
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites); //* Returns the retrieved "favorites" document in the response and ends the stream.
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }) //* Check if user has associated "favorites" document. This line was provided in instructions.
    .then(favorite => { //* Takes the promise returned from .findOne() and places the retrieved favorites document in this "favorite" variable.
        if (favorite) { //* Checking whether a "favorites" document exists; if it does, the code within this block will execute. TBH this seems to me like we are checking TWICE whether this document exists, once with findOne() and again with if(favorite) and I don't understand why, but this is what the directions said to do.
            req.body.forEach(fav => { //* For each campsite ID in the list provided in req.body, we will do the following:
                if (!favorite.campsites.includes(fav._id)) { //* If this user's favorites list does NOT include the campsite, we will use push() to add it to the array.
                    favorite.campsites.push(fav._id);
                }
            });
            favorite.save() //* Must use the save() method or else the updated array will not be saved to our MongoDB server.
            .then(favorite => { //* The promise returned from .save() will hold the updated "favorites" document, which we are storing in this variable.
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite); //*Send the response back to the client with the updated "favorite" document and end the stream.
            })
            .catch(err => next(err));
        } else { //* This code will run if a "favorites" document for this user is NOT found
            Favorite.create({ user: req.user._id, campsites: req.body }) //* Create a new "favorites" document with the appropriate fields passed in from the request object.
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite); //*Send the response back to the client with the new "favorite" document and end the stream.
            })
            .catch(err => next(err));
        }
    }).catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites.');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })//* Check if user has associated "favorites" document. This line was provided in instructions.
    .then(favorite => {
        if (favorite) { //* If the associated "favorites" document exists, the code within this block will execute.
            favorite.remove() //* Delete the favorites document
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite); //*Send the response back to the client with the "favorite" document BEFORE the remove() operation and end the stream. But a subsequent GET request to /favorites will show an empty array.
            })
            .catch(err => next(err));
        } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('You do not have any favorites to delete.') //*Send the plain text response and end the stream.
        }
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }) //* Check if user has associated "favorites" document. This line was provided in instructions.
    .then(favorite => { 
        if (!favorite) { //* If the user has no "favorites" document, the following code will execute.
            Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] }) //* Create a new "favorites" document with the appropriate fields passed in from the request object.
            .then(favorite => { //* The promise returned from .create() will hold the new "favorites" document, which we are storing in this variable.
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite); //* Send the newly created "favorites" document back to the client and end the stream.
            })
            .catch(err => next(err));
        } else {
            if (!favorite.campsites.includes(req.params.campsiteId)) { //* If the user has a favorites document but it does NOT include the campsite ID passed in from the request object the following code will execute
                favorite.campsites.push(req.params.campsiteId); //* Add the campsite to the list
                favorite.save() //* Save the updated document. The updates will not transfer to the MongoDB server without this.
                .then(favorite => { //* The promise returned from save() will hold the updated "favorites" document, which we are storing in this variable.
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite); //* Send the updated "favorites" document back to the client and end the stream.
                })
                .catch(err => next(err));
            } else { //* I beleive this "else" block will only execute if there WAS as "favorites" document AND the campsite ID was already in it. I don't think I have to specify with an else/if because I think I've already covered any other non-error options.
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('That campsite is already a favorite!'); //* Send back the plain text message and end the stream.
            }
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }) //* Check if user has associated "favorites" document. This line was provided in instructions.
    .then(favorite => { //* Takes the promise returned from .findOne() and places the retrieved favorites document in this "favorite" variable.
        if (favorite) { //* If the associated "favorites" document exists, the following code will execute
            const index = favorite.campsites.indexOf(req.params.campsiteId); //* Passes the campsite ID we want to delete into the indexOf method, which will search for that ID in the array and place it in the "index" variable.
            if (index >= 0) { //* indexOf returns -1 if the passed-in value is not found, so a value of >=0 means it was found. 
                favorite.campsites.splice(index, 1); //* If that's the case, we will splice one item from the array beginning at item "index".
            }
            favorite.save() //* Save the updated document. The updates will not transfer to the MongoDB server without this.
            .then(favorite => { //* The promise returned from save() will hold the updated "favorites" document, which we are storing in this variable.
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite); //* Send the updated "favorites" document back to the client and end the stream.
            }).catch(err => next(err));
        } else { //* This executes if a "favorites" document does not exist.
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('You have no favorites to delete.') //*Send the plain text response and end the stream.
        }
    }).catch(err => next(err))
});

module.exports = favoriteRouter;