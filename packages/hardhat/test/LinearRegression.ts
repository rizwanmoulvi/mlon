import { expect } from "chai";
import { ethers } from "hardhat";
import { DataLayer, LinearRegression } from "../typechain-types";

describe("LinearRegression", function () {
  // We define a fixture to reuse the same setup in every test.

  let DataLayer: DataLayer;
  let LinearRegression: LinearRegression;

  before(async () => {
    const dataLayerFactory = await ethers.getContractFactory("DataLayer");
    DataLayer = (await dataLayerFactory.deploy()) as DataLayer;
    await DataLayer.waitForDeployment();

    const LinearRegressionFactory = await ethers.getContractFactory("LinearRegression");
    LinearRegression = (await LinearRegressionFactory.deploy(await DataLayer.getAddress())) as LinearRegression;
    await LinearRegression.waitForDeployment();
  });

  describe("LinearRegression on offchain data", function () {
    it("should give correct predictions", async function () {
      let data = [
        [0n, 0n, 0n, 0n, 0n, 0n],
        [1n, 1n, 1n, 1n, 1n, 1n],
        [2n, 2n, 2n, 2n, 2n, 2n],
        [3n, 3n, 3n, 3n, 3n, 3n],
      ];

      data = data.map(arr => {
        return arr.map(i => i * 10n ** 9n);
      });

      let labels = [0n, 1n, 2n, 3n];
      labels = labels.map(i => i * 10n ** 9n);

      let testData: bigint[][] = [[5n, 5n, 5n, 5n, 5n, 5n]];

      testData = testData.map(arr => {
        return arr.map(i => i * 10n ** 9n);
      });

      let expectedPredictions = [5n];

      expectedPredictions = expectedPredictions.map(i => i * 10n ** 9n);

      const learningRate: bigint = 5n * 10n ** 7n;
      const iterations = 100n;
      const bias = 0n;

      const predictions = await LinearRegression.getLinearRegressionOffChainData(
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
