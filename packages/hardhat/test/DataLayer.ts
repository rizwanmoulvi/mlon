import { expect } from "chai";
import { ethers } from "hardhat";
import { DataLayer } from "../typechain-types";
import { encodeBytes32String } from "ethers";

describe("DataLayer", function () {
  // We define a fixture to reuse the same setup in every test.

  let DataLayer: DataLayer;

  before(async () => {
    const dataLayerFactory = await ethers.getContractFactory("DataLayer");
    DataLayer = (await dataLayerFactory.deploy()) as DataLayer;
    await DataLayer.waitForDeployment();
  });

  describe("Schema", function () {
    it("Should be able to create a new schema", async function () {
      const schemaName = encodeBytes32String("schema1Test1");
      const column1 = encodeBytes32String("col1");
      const column2 = encodeBytes32String("col2");
      const column3 = encodeBytes32String("col3");

      await DataLayer.addSchema(schemaName, [column1, column2, column3], 0n);

      const schemaIndex = await DataLayer.schemaIndex(schemaName);

      expect(await DataLayer.dappAnalytics(schemaIndex)).to.deep.equal([schemaName, 0n]);
      expect(await DataLayer.getColumnsOfSchema(schemaName)).to.deep.equal([column1, column2, column3]);
    });
  });

  describe("AddAnalytics", function () {
    it("Should be able to add new user's analytics", async function () {
      const schemaName = encodeBytes32String("schema1Test2");
      const column1 = encodeBytes32String("col1");
      const column2 = encodeBytes32String("col2");
      const column3 = encodeBytes32String("col3");

      const [owner, dapp1, user1] = await ethers.getSigners();

      const initialUserBalance = await ethers.provider.getBalance(user1);

      await DataLayer.connect(owner).addSchema(schemaName, [column1, column2, column3], 0n);

      await DataLayer.connect(dapp1).addAnalytics(user1.address, schemaName, [column1], [1n], {
        value: 10000000000000000n,
      });

      const userId = await DataLayer.addressToId(user1.address);

      expect(await DataLayer.userActivityMatrix(userId, 0n)).to.deep.equal(1n);
      expect(await DataLayer.getAnalyticsDataBySchemaName(schemaName)).to.deep.equal([
        [0, 0, 0],
        [1, 0, 0],
      ]);

      const finalUserBalance = await ethers.provider.getBalance(user1);

      expect(finalUserBalance - initialUserBalance).to.equal(10000000000000000n);

      expect(await DataLayer.consumerCredits(dapp1.address)).to.equal(1);

      expect(await DataLayer.getSchemaAddressToId(schemaName, user1.address)).to.equal(1);

      expect(await DataLayer.getSchemaIdToAddress(schemaName, 1)).to.equal(user1.address);
    });
  });
});
