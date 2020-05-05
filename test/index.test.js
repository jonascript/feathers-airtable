import express from "@feathersjs/express";
import feathers from "@feathersjs/feathers";
import dotenv from "dotenv";
import AirtableService from "../src/index";

dotenv.config();

const TEST_TABLE_NAME = process.env.TEST_TABLE_NAME;
const TEST_BASE_ID = process.env.TEST_BASE_ID;
const ITEM_NAME = "Unit Test Item";

jest.setTimeout(30000);
const app = express(feathers());

describe("Airtable service", () => {
  let mockRecord, service;

  beforeAll((done) => {
    const options = {
      apiKey: "key0XYHCXug7QWUL9",
      tableName: TEST_TABLE_NAME,
      baseId: TEST_BASE_ID,
    };

    app.use("/airtable", new AirtableService(options));

    service = app.service("airtable");

    const mockData = {
      fields: {
        Name: ITEM_NAME,
        Notes: "This is a note.",
      },
    };

    service.create(mockData).then((output) => {
      mockRecord = output;
      done();
    });
  });

  it("registered the service", (done) => {
    expect(service).toBeTruthy();
    done();
  });

  it("can find a record", (done) => {
    service
      .find({
        tableName: TEST_TABLE_NAME,
        baseId: TEST_BASE_ID,
        filterByFormula: `{Name} = '${ITEM_NAME}'`,
      })
      .then((records) => {
        for (let record of records) {
          expect(record).toBeTruthy();
          expect(record.get("Name")).toBe(ITEM_NAME);
        }
        done();
      });
  });

  describe("create", () => {
    it("creates a single new instance and returns the created instance", (done) => {
      service
        .create({
          fields: {
            Name: ITEM_NAME,
            Notes: "This is a note.",
          },
        })
        .then((output) => {
          expect(mockRecord).toBeTruthy();
          expect(mockRecord.get("Name")).toBe(ITEM_NAME);
          done();
        });
    });

    it("creates multiple new instances", (done) => {
      service
        .create([
          {
            fields: {
              Name: ITEM_NAME,
              Notes: "This is a note 1.",
            },
          },
          {
            fields: {
              Name: ITEM_NAME,
              Notes: "This is a note 2.",
            },
          },
        ])
        .then((output) => {
          expect(output).toBeTruthy();
          expect(output.length).toEqual(2);
          expect(output[0].get("Name")).toBe(ITEM_NAME);
          expect(output[0].get("Notes")).toBe("This is a note 1.");
          expect(output[1].get("Name")).toBe(ITEM_NAME);
          expect(output[1].get("Notes")).toBe("This is a note 2.");
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

  it("can update a record", (done) => {
    const mockData = {
      id: mockRecord.id,
      fields: { Name: ITEM_NAME },
    };
    service.update(null, [mockData]).then((output) => {
      expect(output).toBeTruthy();
      expect(output[0].get("Name")).toBe(ITEM_NAME);
      done();
    });
  });

  it("can delete a record", (done) => {
    service.remove(mockRecord.id).then((output) => {
      expect(output).toBe(mockRecord.id);
      done();
    });
  });
});

// feathers-rethinky
//   extend
//     ✓ extends and uses extended method
//   get
//     ✓ returns an instance that exists
//     ✓ returns NotFound error for non-existing id
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
