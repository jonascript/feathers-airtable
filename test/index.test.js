import express from "@feathersjs/express";
import feathers from "@feathersjs/feathers";
import dotenv from "dotenv";
import AirtableService from "../src/index";

dotenv.config();

const TEST_TABLE_NAME = process.env.TEST_TABLE_NAME;
const TEST_BASE_ID = process.env.TEST_BASE_ID;
const ITEM_NAME = "Unit Test Item";

jest.setTimeout(5000);
const app = express(feathers());

describe("Airtable service", () => {
  let i = 1;
  let mockRecord, service;
  const mockData = {
    fields: {
      Name: ITEM_NAME,
      Notes: `This is a note.`,
    },
  };

  beforeAll((done) => {
    const options = {
      apiKey: "key0XYHCXug7QWUL9",
      tableName: TEST_TABLE_NAME,
      baseId: TEST_BASE_ID,
    };

    app.use("/airtable", new AirtableService(options));

    service = app.service("airtable");

    service.create(mockData).then((output) => {
      mockRecord = output;
      done();
    });
  });

  afterAll((done) => {
    service.remove(mockRecord.id).then((output) => {
      done();
    });
  });

  it("registered the service", (done) => {
    expect(service).toBeTruthy();
    done();
  });

  describe("find", () => {
    it("returns all items", (done) => {
      service.find({}).then((records) => {
        for (let record of records) {
          expect(record).toBeTruthy();
          expect(record.get("Name")).toBeTruthy();
        }
        done();
      });
    });

    it("filters results by a single parameter", (done) => {
      var params = { query: { fields: { Notes: `This is a note.` } } };

      service
        .find(params)
        .then((data) => {
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBe(1);
          expect(data.length > 0).toBe(true);
          expect(data[0].get("Name")).toEqual(ITEM_NAME);
          done();
        })
        .catch(done);
    });

    it("filters results by multiple parameters", (done) => {
      var params = {
        query: { fields: { Notes: `This is a note.`, Name: ITEM_NAME } },
      };

      service
        .find(params)
        .then((data) => {
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBe(1);
          expect(data.length > 0).toBe(true);
          expect(data[0].get("Name")).toEqual(ITEM_NAME);
          done();
        })
        .catch(done);
    });

    it("can handle complex nested special queries", (done) => {
      var params = {
        query: {
          $or: [
            {
              name: "Doug",
            },
            {
              age: {
                $gte: 18,
                $not: 25,
              },
            },
          ],
        },
      };

      service
        .find(params)
        .then((data) => {
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBe(1);
          expect(data.length > 0).toBe(true);
          expect(data[0].get("Name")).toEqual(ITEM_NAME);
          done();
        })
        .catch(done);
    });
    //     special filters
    //       ✓ can $sort
    //       ✓ can $limit
    //       ✓ can $skip
    //       ✓ can $select
    //       ✓ can $or
    //       - can $not
    //       ✓ can $in
    //       ✓ can $nin
    //       ✓ can $lt
    //       ✓ can $lte
    //       ✓ can $gt
    //       ✓ can $gte
    //       ✓ can $ne
    //       - can $populate

    describe("special filters", () => {
      let mockRecord;
      beforeAll((done) => {
        service.create(mockData).then((output) => {
          mockRecord = output;
          done();
        });
      });

      it("can $limit", (done) => {
        var params = {
          query: { $limit: 1, fields: { Notes: `This is a note.` } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(1);
            expect(data.length > 0).toBe(true);
            expect(data[0].get("Name")).toEqual(ITEM_NAME);
            done();
          })
          .catch(done);
      });

      afterAll((done) => {
        service.remove(mockRecord.id).then((output) => {
          done();
        });
      });
    });
  });

  describe("remove", () => {
    let testRecord, testRecordIds;

    beforeEach((done) => {
      const mockData = {
        fields: {
          Name: ITEM_NAME + " Remove",
          Notes: "This is a note.",
        },
      };
      service.create(mockData).then((record) => {
        testRecord = record;
        testRecordIds = [record.id];
        done();
      });
    });

    it("deletes an existing instance and returns the deleted instance", (done) => {
      service.remove(testRecord.id).then((output) => {
        expect(output.id).toBe(testRecord.id);
        done();
      });
    });

    // it("deletes multiple instances", (done) => {
    //   service.create(mockData).then((record) => {
    //     testRecordIds.push(record.id);
    //     service
    //       .remove(null, {
    //         query: {
    //           id: {
    //             $in: testRecordIds,
    //           },
    //         },
    //       })
    //       .then((output) => {
    //         expect(output.id).toBe(testRecord.id);
    //         done();
    //       });
    //   });
    // });
  });

  describe("extend", () => {
    let testRecord;
    const mockData = {
      fields: {
        Name: ITEM_NAME,
        Notes: "This is a note.",
      },
    };
    it("extends and uses extended method", (done) => {
      let now = new Date().getTime();
      let extended = service.extend({
        create(data) {
          data.fields.Name += " Extend " + now;
          return this._super.apply(this, arguments);
        },
      });

      extended.create(mockData).then((record) => {
        testRecord = record;
        expect(record.get("Name")).toEqual("Unit Test Item Extend " + now);
        done();
      });
    });

    afterEach((done) => {
      service.remove(testRecord.id).then((record) => {
        done();
      });
    });
  });

  describe("create", () => {
    let testIds = [];

    afterEach((done) => {
      for (let x = 0; x < testIds.length; x++) {
        service.remove(testIds[x]);
      }

      done();
    });
    it("creates a single new instance and returns the created instance", (done) => {
      service
        .create({
          fields: {
            Name: ITEM_NAME,
            Notes: "This is a note create.",
          },
        })
        .then((output) => {
          expect(output).toBeTruthy();
          expect(output.get("Name")).toBe(ITEM_NAME);
          testIds.push(output.id);
          done();
        });
    });

    it("creates multiple new instances", (done) => {
      service
        .create([
          {
            fields: {
              Name: ITEM_NAME,
              Notes: "This is a note create 1.",
            },
          },
          {
            fields: {
              Name: ITEM_NAME,
              Notes: "This is a note create 2.",
            },
          },
        ])
        .then((output) => {
          expect(output).toBeTruthy();
          expect(output.length).toEqual(2);
          expect(output[0].get("Name")).toBe(ITEM_NAME);
          expect(output[0].get("Notes")).toBe("This is a note create 1.");
          expect(output[1].get("Name")).toBe(ITEM_NAME);
          expect(output[1].get("Notes")).toBe("This is a note create 2.");

          testIds = output.map((record) => record.id);

          done();
        });
    });
  });

  describe("patch", () => {
    // ✓ updates an existing instance
    // ✓ patches multiple instances
    // ✓ returns NotFound error for non-existing id
  });

  describe("get", () => {
    it("returns an instance that exists", (done) => {
      service.get(mockRecord.id).then((output) => {
        expect(output).toBeTruthy();
        expect(output.get("Name")).toBe(ITEM_NAME);
        done();
      });
    });

    it("returns NotFound error for non-existing id", (done) => {
      service
        .get("badid123")
        .then((output) => {})
        .catch((err) => {
          expect(err).toBeTruthy();
          expect(err.error).toEqual("NOT_FOUND");
          expect(err.statusCode).toEqual(404);
          done();
        });
    });
  });

  // it("can update a record", (done) => {
  //   // update
  //   // - replaces an existing instance
  //   // - returns NotFound error for non-existing id
  //   const mockData = {
  //     id: mockRecord.id,
  //     fields: { Name: ITEM_NAME },
  //   };
  //   service.update(null, [mockData]).then((output) => {
  //     expect(output).toBeTruthy();
  //     expect(output[0].get("Name")).toBe(ITEM_NAME);
  //     done();
  //   });
  // });
});

// feathers-rethinky

//   remove
//     ✓ deletes an existing instance and returns the deleted instance
//     ✓ deletes multiple instances
//   find
//     ✓ returns all items
//     ✓ filters results by a single parameter
//     ✓ filters results by multiple parameters
//     - can handle complex nested special queries
//     special filters
//       ✓ can $sort
//       ✓ can $limit
//       ✓ can $skip
//       ✓ can $select
//       ✓ can $or
//       - can $not
//       ✓ can $in
//       ✓ can $nin
//       ✓ can $lt
//       ✓ can $lte
//       ✓ can $gt
//       ✓ can $gte
//       ✓ can $ne
//       - can $populate
//     paginate
//       - returns paginated object, paginates by default and shows total
//       - paginates max and skips
//   update
//     - replaces an existing instance
//     - returns NotFound error for non-existing id
//   patch
//     ✓ updates an existing instance
//     ✓ patches multiple instances
//     ✓ returns NotFound error for non-existing id
//   create
//     ✓ creates a single new instance and returns the created instance
//     ✓ creates multiple new instances
