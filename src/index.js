import Airtable from "airtable";

/* eslint-disable no-unused-vars */
class Service {
  constructor(options) {
    this.options = options || {};
    const { apiKey, tableName, baseId } = this.options;
    this.base = new Airtable({ apiKey }).base(baseId);
  }

  setup(app) {
    this.app = app;
  }

  async find(params) {
    return new Promise((resolve, reject) => {
      const { query } = params;
      let filterByFormula = "";

      if (query) {
        const filters = Object.keys(query.fields).map((key) => {
          return `{${key}} = '${query.fields[key]}'`;
        });
        filterByFormula = filters.join(",");
      }

      const output = [];
      this.base(this.options.tableName)
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
              return reject(err);
            }
            return resolve(output);
          }
        );
    });
  }

  get(id, params) {
    return new Promise((resolve, reject) => {
      this.base(this.options.tableName)
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
      this.base(this.options.tableName)
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
      this.base(this.options.tableName)
        .update(reqData)
        .then((result) => {
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }

  remove(id, params) {
    if (!id) {
      this.find(params).then((records) => {
        if (Array.isArray(records)) {
          return Promise.all(records.map((current) => this.remove(current.id)));
        }
      });
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName)
        .destroy([id])
        .then((result) => {
          if (Array.isArray(result)) {
            resolve(result[0]);
          } else {
            resolve(result);
          }
        })
        .catch((err) => reject(err));
    });
  }
}

export default function (options) {
  return new Service(options);
}

export { Service };
