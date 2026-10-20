/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3552922951")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id = creator.id || public = true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3552922951")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id = creator.id"
  }, collection)

  return app.save(collection)
})
