import { useEffect, useState } from "react";
import { Abi, createPublicClient, fromHex, getContract, http } from "viem";
import { opBNBTestnet } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

type DataTableProps = {
  schema: string;
};

export const DataTable = ({ schema }: DataTableProps) => {
  const [columns, setColumns] = useState<Array<`0x${string}`>>();
  const [data, setData] = useState<any>();

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const getSchemaData = async () => {
      try {
        const userAnalyticsContractData = getContract({
          abi: deployedContracts[5611].DataLayer.abi as Abi,
          address: deployedContracts[5611].DataLayer.address,
          client: { public: publicClient },
        });

        const data_ = await userAnalyticsContractData.read.getAnalyticsDataBySchemaName([schema]);
        const columns_ = await userAnalyticsContractData.read.getColumnsOfSchema([schema]);

        setColumns(columns_ as Array<`0x${string}`>);
        const dataTuple: unknown[][] = [];
        (data_ as any).map(async (d: Array<number>, idx: number) => {
          // const address = await userAnalyticsContractData.read.getSchemaIdToAddress([schema, idx]);

          dataTuple.push([idx, ...d]);
        });

        setData(dataTuple);
      } catch (e) {
        console.log(e);
      }
    };

    getSchemaData();
  }, [schema]);

  return (
    <div className="flex justify-center px-4 md:px-0">
      <div className="overflow-x-auto w-full shadow-2xl rounded-xl">
        <table className="table text-xl bg-base-100 table-zebra w-full md:table-md table-sm">
          <thead>
            <tr className="rounded-xl text-sm text-base-content">
              <th className="bg-primary" key={2}>
                User ID
              </th>
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
            {data?.map((dpoint: Array<string | number>, idx: number) => (
              <>
                {idx > 0 ? (
                  <tr key={idx}>
                    {dpoint.map((i: string | number, index: number) => (
                      <>
                        {index == 0 ? (
                          <td className="md:py-4">
                            {/* <Address address={String(i)} size="sm" /> */}
                            {i}
                          </td>
                        ) : (
                          <td>{i?.toString()}</td>
                        )}
                      </>
                    ))}
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
