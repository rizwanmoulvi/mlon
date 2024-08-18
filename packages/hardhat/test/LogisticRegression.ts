import { expect } from "chai";
import { ethers } from "hardhat";
import { DataLayer, LogisticRegression } from "../typechain-types";

describe("LogisticRegression", function () {
  // We define a fixture to reuse the same setup in every test.

  let DataLayer: DataLayer;
  let LogisticRegression: LogisticRegression;

  before(async () => {
    const dataLayerFactory = await ethers.getContractFactory("DataLayer");
    DataLayer = (await dataLayerFactory.deploy()) as DataLayer;
    await DataLayer.waitForDeployment();

    const LogisticRegressionFactory = await ethers.getContractFactory("LogisticRegression");
    LogisticRegression = (await LogisticRegressionFactory.deploy(await DataLayer.getAddress())) as LogisticRegression;
    await LogisticRegression.waitForDeployment();
  });

  describe("LogisticRegression on offchain data", function () {
    it("should give correct predictions", async function () {
      let data = [
        [0n, 0n, 0n, 0n, 0n, 0n],
        [1n, 1n, 1n, 1n, 1n, 1n],
        [1n, 1n, 1n, 1n, 1n, 1n],
        [0n, 0n, 0n, 0n, 0n, 0n],
        [1n, 1n, 1n, 1n, 1n, 1n],
        [1n, 1n, 1n, 1n, 1n, 1n],
        [0n, 0n, 0n, 0n, 0n, 0n],
        [0n, 0n, 0n, 0n, 0n, 0n],
        [1n, 1n, 1n, 1n, 1n, 1n],
        [0n, 0n, 0n, 0n, 0n, 0n],
      ];

      data = data.map(arr => {
        return arr.map(i => i * 10n ** 9n);
      });

      let labels = [0n, 1n, 1n, 0n, 1n, 1n, 0n, 0n, 1n, 0n];
      labels = labels.map(i => i * 10n ** 9n);

      let testData: bigint[][] = [[1n, 1n, 1n, 1n, 1n, 1n]];

      testData = testData.map(arr => {
        return arr.map(i => i * 10n ** 9n);
      });

      let expectedPredictions = [1n];

      expectedPredictions = expectedPredictions.map(i => i * 10n ** 9n);

      const learningRate: bigint = 5n * 10n ** 7n;
      const iterations = 10n;
      const bias = 0n;

      const predictions = await LogisticRegression.getLogisticRegressionOffChainData(
        data,
        labels,
        testData,
        learningRate,
        iterations,
        bias,
      );

      expect(predictions[0]).to.be.closeTo(expectedPredictions[0], 100000000n);
    });
  });
});
