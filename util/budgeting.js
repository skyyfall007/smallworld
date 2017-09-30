// communicate with db to get daily budget
var getDailyBudget = function(user){
    var id = req.params.id;
    db.collection(USER_COLLECTION).findOne({ _id: new ObjectID(id) }, function(err, doc) {
        if (err) {
            app.handleError(res, err.message, "Failed to find user");
        } else {
            res.status(200).json(doc);
        }
    });
};