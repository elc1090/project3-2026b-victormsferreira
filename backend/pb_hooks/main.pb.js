routerAdd("GET", "/frontpage", (e) => {
    let models = $app.findRecordsByFilter(
        "models",                                    // collection
        "public = true", // filter
        "-updated",                                   // sort
        25,                                            // limit
        0,                                             // offset
    );
    var res = [];
    for (var model of models) {
        var m = {
            id: model.id,
            creator: $app.findRecordById("users", model.get("creator")).get("name"),
            thumbnail: model.get("thumbnail"),
            name: model.get("name"),
        };
        res.push(m);
    }
    return e.json(200, res);
});

routerAdd("GET", "/user/{username}/models", (e) => {
    let user = e.request.pathValue("username");
    let userRecord = $app.findFirstRecordByData("users", "name", user);
    let models = $app.findRecordsByFilter(
        "models",                                    // collection
        "creator = \"" + userRecord.id + "\"",                // filter
        "-updated",                                   // sort
        25,                                            // limit
        0,                                             // offset
    );
    var res = [];
    for (var model of models) {
        var m = {
            id: model.id,
            creator: $app.findRecordById("users", model.get("creator")).get("name"),
            thumbnail: model.get("thumbnail"),
            name: model.get("name"),
        };
        res.push(m);
    }
    return e.json(200, res);
});