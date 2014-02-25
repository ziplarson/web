db.catalog.ensureIndex({'title.title': 'text', authors: 'text', 'publisher.name': 'text', subjects: 'text'}, {
    name: "catalog_search",
    weight: {
        'title.title': 3,
        subjects: 2,
        authors: 1,
        'publisher.name': 1
    }
});