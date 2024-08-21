import { useCallback, useState } from "react";
import { toBytes, toHex } from "viem";
import { useAccount } from "wagmi";
import { TransactionHash } from "~~/app/dataexplorer/[schema]/_components";
import { InputBase } from "~~/components/scaffold-eth";

type CreateSchemaProps = {
  odl: any;
};
export const CreateSchema = ({ odl }: CreateSchemaProps) => {
  const [schemaName, setSchemaName] = useState("Schema Name");
  const [totalCol, setTotalCol] = useState("0");
  const [col, setCol] = useState<Record<number, string>>();
  const [selectedCategory, setSelectedCategory] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [txErrored, setTxErrored] = useState(false);
  const [txHash, setTxHash] = useState("");

  const categories = [...Array(7).keys()];
  const categoryDappMap = {
    0: "Gaming",
    1: "Marketplace",
    2: "Defi",
    3: "Dao",
    4: "Web3Social",
    5: "Identity",
    6: "Certificates",
  };

  const account = useAccount();

  const addSchemaTxn = useCallback(async () => {
    setLoading(true);
    try {
      const columnArray = [...Array(parseInt(totalCol)).keys()].map(i => {
        return toHex(
          toBytes(String(col?.[i]), {
            size: 32,
          }),
        );
      });
      console.log("Schema Name:", schemaName);
      console.log("Column Array:", columnArray);
      console.log("Selected Category:", selectedCategory);
      console.log("Account Address:", account.address);

      const tx = await odl?.write.addSchema(
        [
          toHex(
            toBytes(schemaName, {
              size: 32,
            }),
          ),
          columnArray,
          Number(selectedCategory),
        ],
        { account: account.address },
      );
      setTxHash(tx);
      setTxErrored(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setTxErrored(true);
      console.error("Transaction Error:", e);
    }
  }, [account.address, col, odl?.write, schemaName, selectedCategory, totalCol]);

  return (
    <>
      <div>
        <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
          <p className="font-medium my-0 break-words">Schema Name (String)</p>
          <div className="flex flex-col gap-1.5 w-full">
            <InputBase name="schema name" placeholder="My Schema" value={schemaName} onChange={setSchemaName} />
          </div>
        </div>
        <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
          <p className="font-medium my-0 break-words">Total Columns (Number)</p>
          <div className="flex flex-col gap-1.5 w-full">
            <InputBase name="total columns" placeholder="0" value={totalCol} onChange={setTotalCol} />
          </div>
        </div>
        {parseInt(totalCol) > 0
          ? [...Array(parseInt(totalCol)).keys()].map(i => (
              <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1" key={i}>
                <p className="font-medium my-0 break-words">Column {i} (String)</p>
                <div className="flex flex-col gap-1.5 w-full">
                  <InputBase
                    name="total columns"
                    placeholder="Name"
                    value={col?.[i]}
                    onChange={(value: any) => {
                      setCol(cols => ({ ...cols, [i]: value }));
                    }}
                  />
                </div>
              </div>
            ))
          : null}
        <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
          <p className="font-medium my-0 break-words">Select Category</p>
          <div className="flex flex-col gap-1.5 w-full">
            {categories.length === 0 ? (
              <p className="text-3xl mt-14">No categories found!</p>
            ) : (
              <>
                {categories.length > 1 && (
                  <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                    {categories.map(category => (
                      <button
                        className={`catbutton font-light hover:border-transparent ${
                          category === selectedCategory ? "text-white buttoneffect" : "text-gray-300"
                        }`}
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {categoryDappMap[category as keyof typeof categoryDappMap]}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {txHash ? (
            <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
              <p className="font-medium my-0 break-words">Transaction Successful!</p>
              <div className="flex">
                <TransactionHash hash={txHash} />
              </div>
            </div>
          ) : null}
          <button className="btn btn-secondary btn-sm" onClick={addSchemaTxn} disabled={loading}>
            {txErrored ? "Failed to save, try again!" : "Save"}
            {loading && <span className="loading loading-spinner loading-xs"></span>}
          </button>
        </div>
      </div>
    </>
  );
};
