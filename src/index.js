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
      const filters = [];

      if (params.wheres) {
        for (const where of params.wheres) {
          filters.push(where);
        }
      }

      const selectParams = {};

      if (filters.length) {
        selectParams.filterByFormula = "AND(" + filters.join(",") + ")";
      }

      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseName
      );

      const output = [];
      base(params.tableName || this.options.tableName)
        .select(selectParams)
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
        params.baseName
      );

      base(params.tableName || this.options.tableName)
        .find(id)
        .then((record) => resolve(record))
        .catch((err) => reject(err));
    });
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)));
    }
    return new Promise((resolve, reject) => {
      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseName
      );

      base(params.tableName || this.options.tableName)
        .create([data])
        .then((result) => {
          resolve(result[0]);
        });
    });
  }

  async update(id, data, params) {
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
        params.baseName
      );

      base(params.tableName || this.options.tableName)
        .update(reqData)
        .then((result) => {
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }

  async remove(id, params) {
    return new Promise((resolve, reject) => {
      const base = new Airtable({ apiKey: this.options.apiKey }).base(
        params.baseName
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
