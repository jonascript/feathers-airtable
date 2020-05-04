import Airtable from "airtable";

/* eslint-disable no-unused-vars */
class Service {
  constructor(options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
  }

  async find(params) {
    return new Promise((resolve, reject) => {
      const { filterByFormula } = params;

      const selectParams = {};

      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseId
      );

      const output = [];
      base(params.tableName || this.options.tableName)
        .select({ filterByFormula })
        .eachPage(
          async function page(records, fetchNextPage) {
            records.forEach(function (record) {
              output.push(record);
            });
            fetchNextPage();
          },
          function done(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve(output);
          }
        );
    });
  }

  get(id, params) {
    return new Promise((resolve, reject) => {
      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseId
      );

      base(params.tableName || this.options.tableName)
        .find(id)
        .then((record) => resolve(record))
        .catch((err) => reject(err));
    });
  }

  create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)));
    }
    return new Promise((resolve, reject) => {
      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseId
      );

      base(params.tableName)
        .create([data])
        .then((result) => resolve(result[0]))
        .catch((err) => reject(err));
    });
  }

  update(id, data, params) {
    let reqData;

    // For single resource
    if (id) {
      data.id = id;
      reqData = [data];
    } else {
      reqData = data;
    }

    return new Promise((resolve, reject) => {
      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseId
      );

      base(params.tableName || this.options.tableName)
        .update(reqData)
        .then((result) => {
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }

  remove(id, params) {
    return new Promise((resolve, reject) => {
      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseId
      );

      base(params.tableName || this.options.tableName)
        .destroy([id])
        .then((result) => {
          resolve(id);
        })
        .catch((err) => reject(err));
    });
  }
}

export default function (options) {
  return new Service(options);
}

export { Service };
