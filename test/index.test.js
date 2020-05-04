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
    const options = { apiKey: "key0XYHCXug7QWUL9" };

    app.use("/airtable", new AirtableService(options));

    service = app.service("airtable");

    const mockData = {
      fields: {
        Name: ITEM_NAME,
        Notes: "This is a note.",
      },
    };

    service
      .create(mockData, {
        tableName: TEST_TABLE_NAME,
        baseId: TEST_BASE_ID,
      })
      .then((output) => {
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

  it("can create a record", (done) => {
    expect(mockRecord).toBeTruthy();
    expect(mockRecord.get("Name")).toBe(ITEM_NAME);
    done();
  });

  it("can get a record", (done) => {
    service
      .get(mockRecord.id, {
        tableName: TEST_TABLE_NAME,
        baseId: TEST_BASE_ID,
      })
      .then((output) => {
        expect(output).toBeTruthy();
        expect(output.get("Name")).toBe(ITEM_NAME);
        done();
      });
  });

  it("can update a record", (done) => {
    const mockData = {
      id: mockRecord.id,
      fields: { Name: ITEM_NAME },
    };
    service
      .update(null, [mockData], {
        tableName: TEST_TABLE_NAME,
        baseId: TEST_BASE_ID,
      })
      .then((output) => {
        expect(output).toBeTruthy();
        expect(output[0].get("Name")).toBe(ITEM_NAME);
        done();
      });
  });

  it("can delete a record", (done) => {
    service
      .remove(mockRecord.id, {
        tableName: TEST_TABLE_NAME,
        baseId: TEST_BASE_ID,
      })
      .then((output) => {
        expect(output).toBe(mockRecord.id);
        done();
      });
  });
});
