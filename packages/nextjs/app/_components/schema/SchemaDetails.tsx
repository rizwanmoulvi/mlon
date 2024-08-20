import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { fromHex } from "viem";
import { useAccount } from "wagmi";
import { TransactionHash } from "~~/app/dataexplorer/[schema]/_components";
import { InputBase } from "~~/components/scaffold-eth";

type SchemaDetail = {
  columns: Array<`0x${string}`>;
  schemaCategory: number;
  schemaName: `0x${string}`;
  totalRecords: bigint;
};

type SchemaDetailsProps = {
  schemaList: Array<SchemaDetail>;
  odl: any;
};

export const SchemaDetails = ({ schemaList, odl }: SchemaDetailsProps) => {
  const router = useRouter();
  const [expandCol, setExpandCol] = useState<SchemaDetail>();
  const [toggleCol, setToggleCol] = useState(false);
  const [col, setCol] = useState<Record<string, number>>();
  const [loading, setLoading] = useState(false);
  const [txErrored, setTxErrored] = useState(false);
  const [txHash, setTxHash] = useState("");

  const schemaCategoryMap = {
    0: "Gaming",
    1: "Marketplace",
    2: "Defi",
    3: "Dao",
    4: "Web3Social",
    5: "Identity",
    6: "Certificates",
  };

  const account = useAccount();

  const addDataTxn = useCallback(async () => {
    setLoading(true);
    try {
      const dataArray: number[] = [];
      const columnArray = expandCol?.columns.filter(c => {
        if (col?.[c]) {
          dataArray.push(col[c]);
          return c;
        }
      });

      console.log([account.address, expandCol?.schemaName, columnArray, dataArray]);

      const tx = await odl?.write.addAnalytics([account.address, expandCol?.schemaName, columnArray, dataArray], {
        account: account.address,
      });
      setTxHash(tx);
      setTxErrored(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setTxErrored(true);
      console.log(e);
    }
  }, [account.address, col, expandCol?.columns, expandCol?.schemaName, odl?.write]);

  return (
    <>
      {schemaList?.map(i => (
        <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1" key={i.schemaName}>
          <p className="font-medium my-0 break-words">{fromHex(i.schemaName, "string")}</p>
          <div className="flex-col gap-y-1">
            <div className="flex">
              <div className="font-small ">columns: </div>
              <div className="font-extralight px-2">{i.columns.map(c => fromHex(c, "string")).join(", ")}</div>
            </div>
            <div className="flex">
              <div className="font-small">category: </div>
              <div className="font-extralight px-2">
                {schemaCategoryMap[i.schemaCategory as keyof typeof schemaCategoryMap]}
              </div>
            </div>
            {/* <div className="flex">
              <div className="font-small">created by: </div>
              <div className="font-extralight px-2">
                {i.createdBy.slice(0, 7)}...{i.createdBy.slice(-4, -1)}
              </div>
            </div> */}
            <div className="flex">
              <div className="font-small">total records: </div>
              <div className="font-extralight px-2">{(i.totalRecords - 1n).toString()}</div>
            </div>
          </div>
          <div className="flex justify-between gap-2 flex-wrap">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setExpandCol(i);
                setToggleCol(!toggleCol);
              }}
            >
              Add data
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                router.push(`/dataexplorer/${i.schemaName}`);
              }}
              // disabled={isFetching}
            >
              View Data
            </button>
          </div>
          {txHash ? (
            <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
              <p className="font-medium my-0 break-words">Transaction Successful!</p>
              <div className="flex">
                <TransactionHash hash={txHash} />
              </div>
            </div>
          ) : null}
          {expandCol?.schemaName == i.schemaName && toggleCol == true
            ? i.columns.map(i => (
                <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1" key={i}>
                  <p className="font-medium my-0 break-words">{fromHex(i, "string")} (Number)</p>
                  <div className="flex flex-col gap-1.5 w-full">
                    <InputBase
                      name="total columns"
                      placeholder="0"
                      value={col?.[i]}
                      onChange={(value: any) => {
                        setCol(cols => ({ ...cols, [i]: value }));
                      }}
                    />
                  </div>
                </div>
              ))
            : null}
          {expandCol?.schemaName == i.schemaName && toggleCol == true ? (
            <button className="btn btn-secondary btn-sm" onClick={addDataTxn} disabled={loading}>
              {txErrored ? "Failed to save, try again!" : "Save Data"}
              {loading && <span className="loading loading-spinner lo ding-xs"></span>}
            </button>
          ) : null}
        </div>
      ))}
    </>
  );
};
