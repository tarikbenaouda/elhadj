/* eslint-disable prefer-const */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);

    // Replace comparison operators with MongoDB comparison operators
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Parse the JSON string back to an object
    let queryObjFinal = JSON.parse(queryStr);

    // Check each field in the query object
    // eslint-disable-next-line no-restricted-syntax
    for (let field in queryObjFinal) {
      // If the value of the field is a string containing commas
      if (
        typeof queryObjFinal[field] === 'string' &&
        queryObjFinal[field].includes(',')
      ) {
        // Split the string by commas to get an array of values
        let values = queryObjFinal[field].split(',');
        // Replace the string with an object containing the $in operator and the array of values
        queryObjFinal[field] = { $in: values };
      }
    }

    this.query = this.query.find(queryObjFinal);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
