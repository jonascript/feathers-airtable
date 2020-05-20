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
  let mockRecords = [],
    service;
  const mockData = {
    fields: {
      Name: ITEM_NAME,
      Notes: `This is a note.`,
      Count: i++,
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
      mockRecords.push(output);
      done();
    });
  });

  afterAll(async (done) => {
    for (let x = 0; x < mockRecords.length; x++) {
      await service.remove(mockRecords[x].id);
    }
    done();
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
              Name: ITEM_NAME + "_1",
            },
            {
              Name: ITEM_NAME + "_2",
            },
          ],
        },
      };

      service
        .create({
          fields: {
            Name: ITEM_NAME + "_2",
            Notes: `This is another note.`,
            Count: i++,
          },
        })
        .then((output) => {
          mockRecords.push(output);
          service
            .find(params)
            .then((data) => {
              expect(Array.isArray(data)).toBe(true);
              expect(data.length).toBe(1);
              expect(data.length > 0).toBe(true);
              expect(data[0].get("Name")).toEqual(ITEM_NAME + "_2");
              done();
            })
            .catch(done);
        });
    });

    describe("special filters", () => {
      beforeAll(async (done) => {
        mockRecords.push(
          await service.create({
            fields: {
              Name: ITEM_NAME + "_1",
              Notes: `This is a note.`,
              Count: i++,
            },
          })
        );

        mockRecords.push(
          await service.create({
            fields: {
              Name: ITEM_NAME + "_2",
              Notes: `This is a note..`,
              Count: i++,
            },
          })
        );

        done();
      });

      it("can $not", (done) => {
        var params = {
          query: { $not: { Name: ITEM_NAME } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);

            for (let x = 0; x < data.length; x++) {
              expect(data[x].get("Name")).not.toEqual(ITEM_NAME);
            }

            done();
          })
          .catch(done);
      });

      it("can $ne", (done) => {
        var params = {
          query: { Count: { $ne: 1 } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);
            expect(data[0].get("Notes")).toBeTruthy();
            done();
          })
          .catch(done);
      });

      it("can $lt", (done) => {
        var params = {
          query: { Count: { $lt: 100 } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(4);
            expect(data[0].get("Notes")).toBeTruthy();
            done();
          })
          .catch(done);
      });

      it("can $lte", (done) => {
        var params = {
          query: { Count: { $lte: 1 } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(1);
            expect(data[0].get("Count")).toEqual(1);
            done();
          })
          .catch(done);
      });

      it("can $gt", (done) => {
        var params = {
          query: { Count: { $gt: 1 } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);
            expect(data[0].get("Count")).toBeGreaterThan(1);
            done();
          })
          .catch(done);
      });

      it("can $gte", (done) => {
        var params = {
          query: { Count: { $gte: 3 } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(2);
            expect(data[0].get("Count")).toBeGreaterThan(1);
            done();
          })
          .catch(done);
      });

      it("can $nin", (done) => {
        var params = {
          query: { Name: { $nin: [ITEM_NAME + "_1", ITEM_NAME + "_2"] } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(1);
            expect(data[0].get("Name")).toEqual(ITEM_NAME);
            expect(data[0].get("Notes")).toBeTruthy();
            done();
          })
          .catch(done);
      });

      it("can $in", (done) => {
        var params = {
          query: { Name: { $in: [ITEM_NAME + "_1", ITEM_NAME + "_2"] } },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);
            expect(data[0].get("Name")).not.toEqual(ITEM_NAME);
            expect(data[0].get("Notes")).toBeTruthy();
            done();
          })
          .catch(done);
      });

      it("can $select", (done) => {
        var params = {
          query: { $select: ["Notes"] },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(4);
            expect(data[0].get("Name")).not.toBeTruthy();
            expect(data[0].get("Notes")).toBeTruthy();
            done();
          })
          .catch(done);
      });

      it("can $sort ascending", (done) => {
        var params = {
          query: {
            $sort: {
              Name: 1,
            },
          },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(4);
            expect(data[0].get("Name")).toEqual(ITEM_NAME);
            done();
          })
          .catch(done);
      });

      it("can $sort descending", (done) => {
        var params = {
          query: {
            $sort: {
              Name: -1,
            },
          },
        };

        service
          .find(params)
          .then((data) => {
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(4);
            expect(data[0].get("Name")).toEqual(ITEM_NAME + "_2");
            done();
          })
          .catch(done);
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
            done();
          })
          .catch(done);
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
      service.get(mockRecords[0].id).then((output) => {
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
