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

  /**
   * Maps an airtable record object into a field
   * @param {*} record
   */
  mapAirtableRecordToObject(record) {
    return {
      id: record.id,
      ...record.fields,
    };
  }

  /**
   * Maps an airtable record object into a field
   * @param {*} record
   */
  mapObjectToAirtableRecord(data) {
    return {
      fields: { ...data },
    };
  }

  mapQuery(queryParams) {
    const comparisonOperators = [
      "$ne",
      "$in",
      "$lt",
      "$lte",
      "$gt",
      "$gte",
      "$nin",
      "$in",
    ];

    const condtionals = [];
    const { $or } = queryParams;
    // Base Case
    if (typeof queryParams !== "object") {
      return queryParams;
    }

    if ($or) {
      condtionals.push(
        `OR(${$or
          .filter(
            (queryParam) =>
              ["$or", "$in"].includes(queryParam) ||
              typeof queryParam === "object"
          )
          .map((queryParam) => {
            return Object.keys(queryParam).map((key) => {
              if (typeof queryParam[key] === "object") {
                return this.mapQuery(queryParam);
              } else {
                return `{${key}} = '${this.mapQuery(queryParam[key])}'`;
              }
            });
          })
          .join(",")})`
      );
    } else {
      // AND

      // @todo fix unecessary AND breaking query
      condtionals.push(
        `AND(${Object.keys(queryParams)
          .filter((field) => {
            console.log("THE OPERATOR", field);
            return !comparisonOperators.includes(field);
          })
          .map((field) => {
            if (typeof queryParams[field] === "object") {
              const { $in, $nin, $lt, $lte, $gt, $gte, $ne } = queryParams[
                field
              ];

              if ($in) {
                const $ors = $in.map((param) => {
                  return { [field]: `${param}` };
                });
                return this.mapQuery({ $or: $ors });
              } else if ($nin) {
                const $ors = $nin.map((param) => {
                  return { [field]: `${param}` };
                });
                return `NOT(${this.mapQuery({ $or: $ors })})`;
              } else if ($lt) {
                return `{${field}} < ${$lt}`;
              } else if ($lte) {
                return `{${field}} <= ${$lte}`;
              } else if ($gt) {
                return `{${field}} > ${$gt}`;
              } else if ($gte) {
                return `{${field}} >= ${$gte}`;
              } else if ($ne) {
                return `{${field}} != ${$ne}`;
              } else {
                throw Error(`Invalid Operator ${field}`);
              }
            }
            return `{${field}} = ${this.mapQuery(queryParams[field])}`;
          })
          .join(",")})`
      );
    }

    return condtionals.join(",");
  }

  async find(params) {
    const comparisonOperators = [
      "$ne",
      "$in",
      "$lt",
      "$lte",
      "$gt",
      "$gte",
      "$nin",
      "$in",
    ];

    return new Promise((resolve, reject) => {
      const { query } = params;

      let filterByFormula = "",
        maxRecords = "",
        skip;

      const selectOptions = {};

      if (query) {
        const { $limit, $sort, $select, $skip } = query;

        // For simple equality queries
        const operators = Object.keys(query).filter((queryParam) =>
          comparisonOperators.includes(queryParam)
        );

        const equalityConditionals = Object.keys(query).filter(
          (queryParam) => queryParam.charAt(0) !== "$"
        );

        // if (fields.length) {
        //   this.mapQuery();
        // }

        // @todo Need to refactor this to handle query params better
        // The modifiers should be mapped first
        // Then the conditionals
        // Some modifiers and conditionals contain $
        // So I need to keep a list of which ones are valid
        if (operators.length > 0) {
          const filters = operators.map((key) => {
            if (typeof query[key] === "object") {
              return this.mapQuery({ [key]: query[key] });
            }
            return `{${key}} = '${query[key]}'`;
          });

          console.log(query, filters, operators);

          if (filters.length > 1) {
            filterByFormula = `AND(${filters.join(",")})`;
          } else {
            filterByFormula = filters.join("");
          }
          selectOptions.filterByFormula = filterByFormula;
        } else if (equalityConditionals.length > 0) {
          console.log(equalityConditionals);
          const filters = equalityConditionals.map((key) => {
            if (typeof query[key] === "object") {
              console.log("OBJECT", key, query[key]);
              return this.mapQuery({ [key]: query[key] });
            }
            return `{${key}} = '${query[key]}'`;
          });

          console.log("PARAMS", query, filters, operators);
          if (filters.length > 1) {
            filterByFormula = `AND(${filters.join(",")})`;
          } else {
            filterByFormula = filters.join("");
          }
        }

        console.log("FILTER", filterByFormula);

        if ($sort) {
          selectOptions.sort = Object.keys($sort)
            .filter((key) => key !== "id")
            .map((key) => {
              return { field: key, direction: $sort[key] > 0 ? "asc" : "desc" };
            });
        }

        if ($select) {
          selectOptions.fields = $select;
        }

        if ($limit) {
          selectOptions.maxRecords = parseInt($limit, 10);
        }

        if ($skip) {
          skip = $skip;
          selectOptions.maxRecords += skip;
        }
      }
      const output = [];
      this.base(this.options.tableName)
        .select(selectOptions)
        .eachPage(
          async (records, fetchNextPage) => {
            records.forEach((record) => {
              output.push(this.mapAirtableRecordToObject(record));
            });
            fetchNextPage();
          },
          function done(err) {
            if (err) {
              return reject(err);
            }

            if (skip) {
              return resolve(output.slice(skip));
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
        .then((record) => resolve(this.mapAirtableRecordToObject(record)))
        .catch((err) => reject(err));
    });
  }

  create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)));
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName)
        .create([this.mapObjectToAirtableRecord(data)])
        .then((result) => resolve(this.mapAirtableRecordToObject(result[0])))
        .catch((err) => reject(err));
    });
  }

  patch(id, data, params) {
    let reqData;

    // For single resource
    if (id) {
      reqData = [{ id, ...this.mapObjectToAirtableRecord(data) }];
    } else {
      reqData = data.map((dataItem) =>
        this.mapObjectToAirtableRecord(dataItem)
      );
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName)
        .update(reqData)
        .then((records) => {
          resolve(records.map(this.mapAirtableRecordToObject));
        })
        .catch((err) => reject(err));
    });
  }

  update(id, data, params) {
    let reqData;

    // For single resource
    if (id) {
      data.id = id;
      reqData = [this.mapObjectToAirtableRecord(data)];
    } else {
      reqData = this.mapObjectToAirtableRecord(data);
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName)
        .update(reqData)
        .then((record) => {
          resolve(this.mapAirtableRecordToObject(record));
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

export { Service };

export default function (options) {
  return new Service(options);
}
