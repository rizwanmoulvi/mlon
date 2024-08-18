import { expect } from "chai";
import { ethers } from "hardhat";
import { DataLayer, AnomalyDetection } from "../typechain-types";

describe("AnomalyDetection", function () {
  // We define a fixture to reuse the same setup in every test.

  let DataLayer: DataLayer;
  let AnomalyDetection: AnomalyDetection;

  before(async () => {
    const dataLayerFactory = await ethers.getContractFactory("DataLayer");
    DataLayer = (await dataLayerFactory.deploy()) as DataLayer;
    await DataLayer.waitForDeployment();

    const AnomalyDetectionFactory = await ethers.getContractFactory("AnomalyDetection");
    AnomalyDetection = (await AnomalyDetectionFactory.deploy(await DataLayer.getAddress())) as AnomalyDetection;
    await AnomalyDetection.waitForDeployment();
  });

  describe("AnomalyDetection on offchain data", function () {
    it("should give correct predictions", async function () {
      const data: bigint[][] = [
        [0n, 0n, 0n, 0n, 0n, 0n],
        [110n, 111n, 122n, 113n, 114n, 115n],
        [120n, 121n, 122n, 123n, 124n, 125n],
        [130n, 131n, 132n, 133n, 134n, 135n],
        [140n, 141n, 142n, 143n, 144n, 145n],
        [1500n, 1510n, 1520n, 1530n, 1540n, 1550n],
        [160n, 161n, 162n, 163n, 164n, 165n],
        [170n, 171n, 172n, 173n, 174n, 175n],
        [180n, 181n, 182n, 183n, 184n, 185n],
        [190n, 191n, 192n, 193n, 194n, 195n],
      ];

      const threshold = 50;

      const expectedPredictions = [[1500n, 1510n, 1520n, 1530n, 1540n, 1550n]];

      const predictions = await AnomalyDetection.getAnomalyDetectionOffChainData(data, threshold);

      expect(predictions).to.deep.equal(expectedPredictions);
    });
  });
});
