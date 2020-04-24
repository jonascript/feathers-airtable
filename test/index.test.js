import express from "@feathersjs/express";
import feathers from "@feathersjs/feathers";
import dotenv from "dotenv";
import AirtableService from "../src/index";

dotenv.config();

const TEST_TABLE_NAME = process.env.TEST_TABLE_NAME;
const TEST_BASE_NAME = process.env.TEST_BASE_NAME;

const app = express(feathers());

describe("Airtable service", () => {
  let mockRecord, service;

  beforeAll((done) => {
    const options = { apiKey: "key0XYHCXug7QWUL9" };
    app.use("/airtable", AirtableService(options));
    service = app.service("airtable");

    const mockData = {
      fields: {
        Item: "Eye Protection",
        Condition: "Homemade",
        Qty: 100,
        Firstname: "pohpih",
        "Phone Number": "(914) 329-0233",
        Delivery: "Yes",
        "Item Notes": "Airtable Unit Test",
        Zip: "19914",
        Lastname: "pihpih",
        "Email Address": "joncrockett@gmail.com",
        "Communication Preference": "email",
      },
    };

    service
      .create(mockData, {
        tableName: TEST_TABLE_NAME,
        baseName: TEST_BASE_NAME,
      })
      .then((output) => {
        mockRecord = output;
        done();
      });
  });

  it("registered the service", () => {
    const service = app.service("airtable");
    expect(service).toBeTruthy();
  });

  it("can find a record", (done) => {
    service
      .find({
        tableName: TEST_TABLE_NAME,
        baseName: TEST_BASE_NAME,
        wheres: ['{Lastname} = "pihpih"', '{Item} = "Eye Protection"'],
      })
      .then((records) => {
        for (let record of records) {
          expect(record).toBeTruthy();
          expect(record.get("Item")).toBe("Eye Protection");
          expect(record.get("Lastname")).toBe("pihpih");
        }
        done();
      });
  });

  it("can create a record", (done) => {
    expect(mockRecord).toBeTruthy();
    expect(mockRecord.get("Item")).toBe("Eye Protection");
    expect(mockRecord.get("Lastname")).toBe("pihpih");
    done();
  });

  it("can get a record", (done) => {
    service
      .get(mockRecord.id, {
        tableName: TEST_TABLE_NAME,
        baseName: TEST_BASE_NAME,
      })
      .then((output) => {
        expect(output).toBeTruthy();
        expect(output.get("Item")).toBe("Eye Protection");
        expect(output.get("Lastname")).toBe("pihpih");
        done();
      });
  });

  it("can update a record", (done) => {
    const mockData = {
      id: mockRecord.id,
      fields: { Lastname: "Smith" },
    };
    service
      .update(null, [mockData], {
        tableName: TEST_TABLE_NAME,
        baseName: TEST_BASE_NAME,
      })
      .then((output) => {
        expect(output).toBeTruthy();
        expect(output[0].get("Item")).toBe("Eye Protection");
        expect(output[0].get("Lastname")).toBe("Smith");
        done();
      });
  });

  it("can delete a record", (done) => {
    service
      .remove(mockRecord.id, {
        tableName: TEST_TABLE_NAME,
        baseName: TEST_BASE_NAME,
      })
      .then((output) => {
        expect(output).toBe(mockRecord.id);
        done();
      });
  });
});
