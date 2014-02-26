db.catalog.ensureIndex({'title': 'text', authors: 'text', 'publisher.name': 'text', subjects: 'text'}, {
    name: "catalog_search",
    weight: {
        'title': 3,
        authors: 2, // TODO won't work: authors is now an array, but of objects that include fullName with what we want
        subjects: 2,
        'publisher.name': 1
    }
});