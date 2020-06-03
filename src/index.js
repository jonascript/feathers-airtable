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

  async find(params) {
    const mapConditional = (queryParam) => {
      const { $in, $nin } = queryParam;
      if ($in) {
        const $ors = $in.map((param) => {
          return { [queryParam]: `${param}` };
        });
        return mapQuery({ $or: $ors });
      } else if ($nin) {
        const $ors = $in.map((param) => {
          return { [queryParam]: `${param}` };
        });
        return `NOT(${mapQuery({ $or: $ors })})`;
      } else {
        return mapQuery(queryParam);
      }
    };

    const mapQuery = (queryParams) => {
      const validQueryParams = ["$or", "$in"];
      const condtionals = [];
      const { $or, $and, $gte, $sort, $in } = queryParams;
      // Base Case
      if (typeof queryParams !== "object") {
        return queryParams;
      }
      // OR
      if ($or) {
        condtionals.push(
          `OR(${$or
            .filter(
              (queryParam) =>
                validQueryParams.includes(queryParam) ||
                typeof queryParam === "object"
            )
            .map((queryParam) => {
              return Object.keys(queryParam).map((key) => {
                if (typeof queryParam[key] === "object") {
                  return mapQuery(queryParam);
                } else {
                  return `{${key}} = '${mapQuery(queryParam[key])}'`;
                }
              });
            })
            .join(",")})`
        );
      } else {
        // AND
        condtionals.push(
          `AND(${Object.keys(queryParams)
            .filter(
              (queryParam) =>
                validQueryParams.includes(queryParam) ||
                typeof queryParam === "object" ||
                queryParam[0] !== "$"
            )
            .map((queryParam) => {
              if (typeof queryParams[queryParam] === "object") {
                // Special equality in filter.
                const { $in, $nin, $lt, $lte, $gt, $gte, $ne } = queryParams[
                  queryParam
                ];
                if ($in) {
                  const $ors = $in.map((param) => {
                    return { [queryParam]: `${param}` };
                  });
                  return mapQuery({ $or: $ors });
                } else if ($nin) {
                  const $ors = $nin.map((param) => {
                    return { [queryParam]: `${param}` };
                  });
                  return `NOT(${mapQuery({ $or: $ors })})`;
                } else if ($lt) {
                  return `{${queryParam}} < ${$lt}`;
                } else if ($lte) {
                  return `{${queryParam}} <= ${$lte}`;
                } else if ($gt) {
                  return `{${queryParam}} > ${$gt}`;
                } else if ($gte) {
                  return `{${queryParam}} >= ${$gte}`;
                } else if ($ne) {
                  return `{${queryParam}} != ${$ne}`;
                } else {
                  return mapQuery(queryParam);
                }
              }
              return `{${queryParam}} = ${mapQuery(queryParams[queryParam])}`;
            })
            .join(",")})`
        );
      }

      return condtionals.join(",");
    };

    return new Promise((resolve, reject) => {
      const { query } = params;

      let filterByFormula = "",
        maxRecords = "",
        skip;

      const selectOptions = {};

      if (query) {
        const { $limit, $sort, $select, $skip } = query;

        // For simple equality queries
        const fields = Object.keys(query).filter(
          (queryParam) => queryParam[0] != "$"
        );

        // @todo Need to refactor this to handle query params better
        // The modifiers should be mapped first
        // Then the conditionals
        // Some modifiers and conditionals contain $
        // So I need to keep a list of which ones are valid
        if (fields.length > 0) {
          const filters = fields.map((key) => {
            if (typeof query[key] === "object") {
              return mapQuery({ [key]: query[key] });
            }
            return `{${key}} = '${query[key]}'`;
          });

          if (filters.length > 1) {
            filterByFormula = `AND(${filters.join(",")})`;
          } else {
            filterByFormula = filters.join(",");
          }
          selectOptions.filterByFormula = filterByFormula;
        } else {
          selectOptions.filterByFormula = mapQuery(query);
        }

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
