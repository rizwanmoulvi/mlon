import { expect } from "chai";
import { ethers } from "hardhat";
import { DataLayer, KNN } from "../typechain-types";

describe("KNN", function () {
  // We define a fixture to reuse the same setup in every test.

  let DataLayer: DataLayer;
  let KNN: KNN;

  before(async () => {
    const dataLayerFactory = await ethers.getContractFactory("DataLayer");
    DataLayer = (await dataLayerFactory.deploy()) as DataLayer;
    await DataLayer.waitForDeployment();

    const KNNFactory = await ethers.getContractFactory("KNN");
    KNN = (await KNNFactory.deploy(await DataLayer.getAddress())) as KNN;
    await KNN.waitForDeployment();
  });

  describe("KNN on offchain data", function () {
    it("should give correct predictions", async function () {
      const data: bigint[][] = [
        [0n, 0n, 0n, 0n, 0n, 0n],
        [110n, 111n, 122n, 113n, 114n, 115n],
        [120n, 121n, 122n, 123n, 124n, 125n],
        [130n, 131n, 132n, 133n, 134n, 135n],
        [140n, 141n, 142n, 143n, 144n, 145n],
        [150n, 151n, 152n, 153n, 154n, 155n],
        [160n, 161n, 162n, 163n, 164n, 165n],
        [170n, 171n, 172n, 173n, 174n, 175n],
        [180n, 181n, 182n, 183n, 184n, 185n],
        [190n, 191n, 192n, 193n, 194n, 195n],
      ];

      const row = [145n, 146n, 147n, 148n, 149n, 150n];
      const k = 3n;
      const distance = 0;

      const expectedPredictions = [
        [140n, 141n, 142n, 143n, 144n, 145n],
        [150n, 151n, 152n, 153n, 154n, 155n],
        [130n, 131n, 132n, 133n, 134n, 135n],
      ];

      const predictions = await KNN.getKNNOffChainData(data, row, k, distance);

      expect(predictions).to.deep.equal(expectedPredictions);
    });
  });
});
