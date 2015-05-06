function FakeProduct(spec) {
    this.pid = spec.pid || pidRequired;
    this.thumbnail_url = 'img/products/' + spec.pid + '.jpg';
    this.name = spec.name || nameRequired;
    this.creator_name = spec.creator_name || creatorNameRequired;
    this.category_name = spec.category_name || categoryNameRequired;
    this.is_female = spec.is_female;
}
