/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3552922951")

  // update field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "file3277268710",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": [
      "image/png"
    ],
    "name": "thumbnail",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [
      "128x128f"
    ],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3552922951")

  // update field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "file3277268710",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": [
      "image/png"
    ],
    "name": "thumbnail",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [
      "64x64"
    ],
    "type": "file"
  }))

  return app.save(collection)
})
