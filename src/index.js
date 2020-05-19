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
    // _find(params, getFilter) {
    //   params = params.query || {};
    //   let query = this.Model.getJoin(this.joinModels);
    //     //Break our some params.
    //  // console.log(getFilter.toString());
    //   if(!getFilter){
    //     getFilter = filter;
    //   }
    //   const filters = getFilter(params);
    //   //console.log("filters",filters);
    //   //console.log("params",params);
    //   if (filters.$select) {
    //     query = query.pluck(filters.$select);
    //   }
    //   if (filters.$limit) {
    //     query = query.limit(filters.$limit);
    //   }
    //   if (filters.$sort) {
    //     Object.keys(filters.$sort).forEach(function (element) {
    //       query = query.orderBy(element);
    //     }, this);
    //   }
    //   if (filters.$skip) {
    //     query = query.skip(filters.$skip);
    //   }
    //   if (params.$or) {
    //     query = query.filter(orMapper(params.$or));
    //     delete params.$or;
    //   }
    //   if (params.$not) {
    //     query = query.filter(notMapper(params.$not));
    //     delete params.$not;
    //   }
    //     //See if any of the name params have a special result on them
    //   return query.filter(parseQuery(params)).run().then(function(values){
    //     const total = 3;
    //     const paginator = {
    //       total,
    //       limit: filters.$limit,
    //       skip: filters.$skip || 0,
    //       data: values
    //     };
    //     return Promise.resolve(paginator);
    //   });
    // }

    const mapQuery = (queryParams) => {
      const validQueryParams = ["$in", "$or", "$not", "$in"];
      const condtionals = [];
      const { $or, $and, $gte, $not, $sort, $in } = queryParams;

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
      } else if ($not) {
        condtionals.push(
          `NOT(
               ${Object.keys($not).map((key) => {
                 if (typeof $not[key] === "object") {
                   return mapQuery($not);
                 } else {
                   return `{${key}} = '${mapQuery($not[key])}'`;
                 }
               })})`
        );
      } else if ($in) {
        console.log("$in", $in);
      } else {
        // AND
        // @todo this is not mapped correctly
        condtionals.push(
          `AND(${Object.keys(queryParams)
            .filter(
              (queryParam) =>
                validQueryParams.includes(queryParam) ||
                typeof queryParam === "object" ||
                queryParam[0] !== "$"
            )
            .map((queryParam) => {
              if (typeof queryParam === "object") {
                // @todo in
                console.log("queryParam", queryParam);

                // if (queryParams[queryParam].$in) {
                //   const $ors = queryParams[queryParam].$in.map((param) => {
                //     return { [queryParam]: `${param}` };
                //   });

                //   return mapQuery({ $or: $ors });
                // } else {
                return mapQuery(queryParam);
                //   }
              }

              return `{${queryParam}} = ${mapQuery(queryParams[queryParam])}`;
            })
            .join(",")})`
        );
      }

      // @todo $gte
      // if ($gte) {
      //   console.log("GTE", $gte);
      //   output = condtionals.push(``);
      // }

      return condtionals.join(",");
    };

    return new Promise((resolve, reject) => {
      const { query } = params;
      let filterByFormula = "",
        maxRecords = "";

      const selectOptions = {};

      if (query) {
        const { fields, $limit, $or, $sort, $select } = query;

        if (fields) {
          const filters = Object.keys(fields).map((key) => {
            return `{${key}} = '${fields[key]}'`;
          });
          if (filters.length > 1) {
            filterByFormula = `AND(${filters.join(",")})`;
          } else {
            filterByFormula = filters.join(",");
          }
        } else {
          filterByFormula = mapQuery(query);
        }

        selectOptions.filterByFormula = filterByFormula;

        if ($limit) {
          selectOptions.maxRecords = parseInt($limit, 10);
        }

        if ($sort) {
          selectOptions.sort = Object.keys($sort).map((key) => {
            return { field: key, direction: $sort[key] > 0 ? "asc" : "desc" };
          });
        }

        if ($select) {
          selectOptions.fields = $select;
        }
      }

      const output = [];
      this.base(this.options.tableName)
        .select(selectOptions)
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
