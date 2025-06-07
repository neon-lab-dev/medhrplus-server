class Search {
    constructor(query, queryStr) {
        (this.query = query), (this.queryStr = queryStr);
    }
    search() {
        const keyword = this.queryStr.full_name
            ? {
                full_name: {
                    $regex: this.queryStr.full_name,
                    $options: "i",
                },
            }
            : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }
    pagination(resultPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;

        const skip = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);

        return this;
    }
}
module.exports = Search;