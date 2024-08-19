import { useCallback, useEffect, useState } from "react";
import { Abi, PublicClient, createPublicClient, fromHex, getContract, http } from "viem";
import { opBNBTestnet } from "viem/chains";
import { InputBase, IntegerInput } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

type ComputeDataProps = {
  schema: string;
};

export const ComputeData = ({ schema }: ComputeDataProps) => {
  const [expandModel, setExpandModel] = useState("");
  const [toggleModel, setToggleModel] = useState(false);
  const [publicClient, setPublicClient] = useState<PublicClient>();
  const [k, setK] = useState(0n);
  const [knndist, setKnndist] = useState(0n);
  const [columns, setColumns] = useState<Array<`0x${string}`>>([]);
  const [col, setCol] = useState<Record<string, bigint>>();
  const [colTraining, setcolTraining] = useState<Record<string, boolean>>();
  const [colLabel, setColLabel] = useState<`0x${string}`>();
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [learningRate, setLearningRate] = useState(0n);
  const [bias, setBias] = useState(0n);
  const [iterations, setIterations] = useState(0n);
  const [testdata, setTestData] = useState("");
  const [threshold, setThreshold] = useState(0n);
  const [show, setShow] = useState("");
  const [knnPredictions, setKnnPredictions] = useState<bigint[][]>([]);
  const [anomalyDetections, setAnomalyDetections] = useState<bigint[][]>([]);
  const [llmInference, setLlmInference] = useState<string>();

  useEffect(() => {
    const getSchemaData = async () => {
      try {
        const publicClient = createPublicClient({
          chain: opBNBTestnet,
          transport: http(),
        });

        setPublicClient(publicClient);

        const userAnalyticsContractData = getContract({
          abi: deployedContracts[5611].DataLayer.abi as Abi,
          address: deployedContracts[5611].DataLayer.address,
          client: { public: publicClient as PublicClient },
        });

        const columns_ = await userAnalyticsContractData.read.getColumnsOfSchema([schema]);

        setColumns(columns_ as Array<`0x${string}`>);
      } catch (e) {
        console.log(e);
      }
    };

    getSchemaData();
  }, [schema]);

  const predictKNN = useCallback(async () => {
    setLoading(true);
    try {
      const row: bigint[] = [];
      for (let c = 0; c < Number(columns?.length); c++) {
        if (col && col[columns[c]]) {
          row.push(BigInt(col[columns[c]]));
        } else {
          row.push(0n);
        }
      }

      const KNNContract = getContract({
        abi: deployedContracts[5611].KNN.abi as Abi,
        address: deployedContracts[5611].KNN.address,
        client: { public: publicClient as PublicClient },
      });

      const predictions = await KNNContract.read.getKNN([schema, row, k, knndist]);
      setKnnPredictions(predictions as bigint[][]);
      setShow("KNN");
      setErrored(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setErrored(true);
      console.log(e);
    }
  }, [col, columns, k, knndist, publicClient, schema]);

  const predictLinearRegression = useCallback(async () => {
    setLoading(true);
    try {
      const trainingColIndices: bigint[] = [];
      let labelColIndex = 0n;
      columns.map((c, idx) => {
        if (colTraining && colTraining[c] == true) {
          trainingColIndices.push(BigInt(idx));
        }

        if (colLabel == c) {
          labelColIndex = BigInt(idx);
        }
      });

      const LinearRegressionContract = getContract({
        abi: deployedContracts[5611].LinearRegression.abi as Abi,
        address: deployedContracts[5611].LinearRegression.address,
        client: { public: publicClient as PublicClient },
      });

      const testData: bigint[][] = [];
      testData.push([]);
      testdata.split(/(?:,| )+/).map(i => testData[0].push(BigInt(i)));

      const predictions = await LinearRegressionContract.read.getLinearRegression([
        schema,
        trainingColIndices,
        labelColIndex,
        testData,
        learningRate,
        iterations,
        bias,
      ]);
      console.log(predictions);
      setErrored(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setErrored(true);
      console.log(e);
    }
  }, [bias, colLabel, colTraining, columns, iterations, learningRate, publicClient, schema, testdata]);

  const predictAnomalyDetection = useCallback(async () => {
    setLoading(true);
    try {
      const AnomalyDetectionContract = getContract({
        abi: deployedContracts[5611].AnomalyDetection.abi as Abi,
        address: deployedContracts[5611].AnomalyDetection.address,
        client: { public: publicClient as PublicClient },
      });

      const predictions = await AnomalyDetectionContract.read.getAnomalyDetection([schema, threshold]);
      setAnomalyDetections(predictions as bigint[][]);
      setShow("AnomalyDetection");
      setErrored(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setErrored(true);
      console.log(e);
    }
  }, [publicClient, schema, threshold]);

  const llmInferenceCall = useCallback(async () => {
    setExpandModel("LLM Inference");
    setToggleModel(!toggleModel);
    try {
      const userAnalyticsContractData = getContract({
        abi: deployedContracts[5611].DataLayer.abi as Abi,
        address: deployedContracts[5611].DataLayer.address,
        client: { public: publicClient as PublicClient },
      });

      const data_ = await userAnalyticsContractData.read.getAnalyticsDataBySchemaName([schema]);

      const dataset: unknown[][] = [];
      (data_ as any).map(async (d: Array<number>, idx: number) => {
        // const address = await userAnalyticsContractData.read.getSchemaIdToAddress([schema, idx]);

        dataset.push([idx, ...d]);
      });

      (BigInt.prototype as any).toJSON = function () {
        return this.toString();
      };

      const inputCol: Array<string> = [];
      columns.map((i: any, idx) => {
        const stringVal = fromHex(i, "string");

        inputCol[idx] = stringVal;
      });

      const resp = await fetch("/lilypad", {
        method: "POST",
        body: JSON.stringify({
          columns: JSON.stringify(inputCol),
          data: JSON.stringify(dataset),
        }),
      });

      const predictions = await resp.json();
      setLlmInference(predictions.inference);

      setErrored(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setErrored(true);
      console.log(e);
    }
  }, [columns, publicClient, schema, toggleModel]);

  return (
    <>
      <div className="grid grid-cols-4 gap-10 w-full max-w-7xl">
        <div className="z-10">
          <div className="adafelbg bg-base-100 rounded-3xl  border-base-300 flex flex-col mt-10 relative">
            <div className="p-5 divide-y divide-base-300 h-screen overflow-scroll">
              <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                <p className="font-medium my-0 break-words">Choose ML Algorithm</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setExpandModel("KNN");
                    setToggleModel(!toggleModel);
                  }}
                >
                  KNN
                </button>
                {expandModel == "KNN" && toggleModel === true ? (
                  <div className="mb-5">
                    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                      <p className="font-small my-0 break-words">K Value</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="k value"
                          placeholder="0"
                          value={k}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setK(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Select Distance Function</p>
                      <div className="flex flex-row gap-2">
                        <button
                          className={`catbutton font-light hover:border-transparent ${
                            knndist === 0n ? "text-white buttoneffect" : "text-gray-300"
                          }`}
                          onClick={() => setKnndist(0n)}
                        >
                          Euclidean
                        </button>
                        <button
                          className={`catbutton font-light hover:border-transparent ${
                            knndist === 1n ? "text-white buttoneffect" : "text-gray-300"
                          }`}
                          onClick={() => setKnndist(1n)}
                        >
                          Cosine
                        </button>
                      </div>
                      <p className="font-small my-0 break-words">Enter the column ranges</p>
                      {columns
                        ? columns.map(i => (
                            <div className="flex flex-col gap-3 first:pt-0 last:pb-1" key={i}>
                              <p className="font-small my-0 break-words">{fromHex(i, "string")}</p>
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex items-center ml-2">
                                  <span className="block text-xs font-extralight leading-none">number</span>
                                </div>
                                <IntegerInput
                                  name="total columns"
                                  placeholder="0"
                                  value={String(col ? col[i] : 0n)}
                                  onChange={(value: any) => {
                                    setCol(cols => ({ ...cols, [i]: value }));
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        : null}
                      <button className="btn btn-secondary btn-sm" onClick={predictKNN} disabled={loading}>
                        {errored ? "Failed to predict, try again!" : "Train Model and Predict"}
                        {loading && <span className="loading loading-spinner lo ding-xs"></span>}
                      </button>
                    </div>
                  </div>
                ) : null}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setExpandModel("Linear Regression");
                    setToggleModel(!toggleModel);
                  }}
                >
                  Linear Regression
                </button>
                {expandModel == "Linear Regression" && toggleModel === true ? (
                  <div className="mb-5">
                    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                      <p className="font-small my-0 break-words">Learning Rate</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="learning rate"
                          placeholder="0"
                          value={learningRate}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setLearningRate(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Bias</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="bias"
                          placeholder="0"
                          value={bias}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setBias(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Iterations</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="iterations"
                          placeholder="0"
                          value={iterations}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setIterations(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Choose Training Columns</p>
                      {columns.length > 1 && (
                        <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                          {columns.map(column => (
                            <button
                              className={`catbutton font-light hover:border-transparent ${
                                colTraining && colTraining[column] === true
                                  ? "text-white buttoneffect"
                                  : "text-gray-300"
                              }`}
                              key={column}
                              onClick={() => setcolTraining(cols => ({ ...cols, [column]: !colTraining?.[column] }))}
                            >
                              {fromHex(column, "string")}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="font-small my-0 break-words">Choose Label Column</p>
                      {columns.length > 1 && (
                        <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                          {columns.map(column => (
                            <button
                              className={`catbutton font-light hover:border-transparent ${
                                colLabel === column ? "text-white buttoneffect" : "text-gray-300"
                              }`}
                              key={column}
                              onClick={() => setColLabel(column)}
                            >
                              {fromHex(column, "string")}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="font-small my-0 break-words">Test Data (input1, input2...)</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">
                            Comma seperated inputs of corresponding to selected training columns
                          </span>
                        </div>
                        <InputBase
                          name="test data"
                          placeholder="[]"
                          value={testdata}
                          onChange={(value: any) => {
                            setTestData(value);
                          }}
                        />
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={predictLinearRegression} disabled={loading}>
                        {errored ? "Failed to predict, try again!" : "Train Model and Predict"}
                        {loading && <span className="loading loading-spinner lo ding-xs"></span>}
                      </button>
                    </div>
                  </div>
                ) : null}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setExpandModel("Logistic Regression");
                    setToggleModel(!toggleModel);
                  }}
                >
                  Logistic Regression
                </button>
                {expandModel == "Logistic Regression" && toggleModel === true ? (
                  <div className="mb-5">
                    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                      <p className="font-small my-0 break-words">Learning Rate</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="learning rate"
                          placeholder="0"
                          value={learningRate}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setLearningRate(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Bias</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="bias"
                          placeholder="0"
                          value={bias}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setBias(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Iterations</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="iterations"
                          placeholder="0"
                          value={iterations}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setIterations(value);
                          }}
                        />
                      </div>
                      <p className="font-small my-0 break-words">Choose Training Columns</p>
                      {columns.length > 1 && (
                        <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                          {columns.map(column => (
                            <button
                              className={`catbutton font-light hover:border-transparent ${
                                colTraining && colTraining[column] === true
                                  ? "text-white buttoneffect"
                                  : "text-gray-300"
                              }`}
                              key={column}
                              onClick={() => setcolTraining(cols => ({ ...cols, [column]: !colTraining?.[column] }))}
                            >
                              {fromHex(column, "string")}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="font-small my-0 break-words">Choose Label Column</p>
                      {columns.length > 1 && (
                        <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                          {columns.map(column => (
                            <button
                              className={`catbutton font-light hover:border-transparent ${
                                colLabel === column ? "text-white buttoneffect" : "text-gray-300"
                              }`}
                              key={column}
                              onClick={() => setColLabel(column)}
                            >
                              {fromHex(column, "string")}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="font-small my-0 break-words">Test Data ([[Row 1 Array], [Row 2 Array]...])</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">Array</span>
                        </div>
                        <InputBase
                          name="test data"
                          placeholder="[]"
                          value={testdata}
                          onChange={(value: any) => {
                            setTestData(value);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setExpandModel("Anomaly Detection");
                    setToggleModel(!toggleModel);
                  }}
                >
                  Anomaly Detection
                </button>
                {expandModel == "Anomaly Detection" && toggleModel === true ? (
                  <div className="mb-5">
                    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                      <p className="font-small my-0 break-words">Threshold</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="block text-xs font-extralight leading-none">number</span>
                        </div>
                        <IntegerInput
                          name="threshold"
                          placeholder="0"
                          value={threshold}
                          disableMultiplyBy1e18={true}
                          onChange={(value: any) => {
                            setThreshold(value);
                          }}
                        />
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={predictAnomalyDetection} disabled={loading}>
                      {errored ? "Failed to predict, try again!" : "Train Model and Predict"}
                      {loading && <span className="loading loading-spinner lo ding-xs"></span>}
                    </button>
                  </div>
                ) : null}
                <button className="btn btn-secondary btn-sm" onClick={llmInferenceCall}>
                  Run Inference
                </button>
                {expandModel == "LLM Inference" && toggleModel === true && llmInference ? (
                  <div className="mb-5">
                    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                      <p className="font-small my-0 break-words">{llmInference}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-3">
          <div className="z-10">
            <div className="adafelbg bg-base-100 rounded-3xl  border-base-300 flex flex-col mt-10 relative">
              <div className="p-5 divide-y divide-base-300 h-screen overflow-scroll">
                {knnPredictions.length > 0 && show == "KNN" ? (
                  <div className="overflow-x-auto w-full shadow-2xl rounded-xl">
                    <p className="font-medium my-0 mb-5 break-words">KNN Predictions</p>
                    <table className="table text-xl bg-base-100 table-zebra w-full md:table-md table-sm">
                      <thead>
                        <tr className="rounded-xl text-sm text-base-content">
                          {columns?.map(i => (
                            <>
                              <th className="bg-primary" key={i}>
                                {fromHex(i, "string")}
                              </th>
                            </>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {knnPredictions?.map((dpoint: Array<bigint>, idx: number) => (
                          <>
                            {idx > 0 ? (
                              <tr key={idx}>
                                {dpoint.map((i: bigint) => (
                                  <>
                                    <td>{i?.toString()}</td>
                                  </>
                                ))}
                              </tr>
                            ) : null}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {anomalyDetections.length > 0 && show == "AnomalyDetection" ? (
                  <div className="overflow-x-auto w-full shadow-2xl rounded-xl">
                    <p className="font-medium my-0 mb-5 break-words">Anomaly Detections</p>
                    <table className="table text-xl bg-base-100 table-zebra w-full md:table-md table-sm">
                      <thead>
                        <tr className="rounded-xl text-sm text-base-content">
                          {columns?.map(i => (
                            <>
                              <th className="bg-primary" key={i}>
                                {fromHex(i, "string")}
                              </th>
                            </>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {anomalyDetections?.map((dpoint: Array<bigint>, idx: number) => (
                          <>
                            {idx > 0 ? (
                              <tr key={idx}>
                                {dpoint.map((i: bigint) => (
                                  <>
                                    <td>{i?.toString()}</td>
                                  </>
                                ))}
                              </tr>
                            ) : null}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
