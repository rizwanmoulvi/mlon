"use client";

import { useEffect, useState } from "react";
import { JSXElementConstructor, PromiseLikeOfReactNode, ReactElement, ReactNode, ReactPortal } from "react";
import { BackButton } from "../../_components";
import { Abi, createPublicClient, fromHex, getContract, http } from "viem";
import { filecoinCalibration } from "viem/chains";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

type PageProps = {
  params: { address: string; schema: string };
};

// export function generateStaticParams() {
//   // An workaround to enable static exports in Next.js, generating single dummy page.
//   return [{ address: "0x0000000000000000000000000000000000000000" }];
// }

const AddressPage = ({ params }: PageProps) => {
  const [columns, setColumns] = useState<Array<`0x${string}`>>();
  const [data, setData] = useState<any>();
  // const data = [[params.address, 3, 6, 5, 8, 3]];
  // const schemas = {
  //   schemaName: "schemaName1",
  //   columns: ["col1", "col2", "col3", "col4", "col5"],
  //   category: "gaming",
  //   createdBy: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
  //   totalRecords: 100,
  // };

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: filecoinCalibration,
      transport: http(),
    });

    const getSchemaData = async () => {
      try {
        const userAnalyticsContractData = getContract({
          abi: deployedContracts[314159].DataLayer.abi as Abi,
          address: deployedContracts[314159].DataLayer.address,
          client: { public: publicClient },
        });

        const data_ = await userAnalyticsContractData.read.getAnalyticsDataBySchemaName([params.schema]);
        const columns_ = await userAnalyticsContractData.read.getColumnsOfSchema([params.schema]);
        const index = await userAnalyticsContractData.read.getSchemaAddressToId([params.schema, params.address]);

        setColumns(columns_ as Array<`0x${string}`>);
        const dataTuple = [params.address, ...(data_ as number[][])[index as number]];

        console.log(dataTuple);
        setData(dataTuple);
      } catch (e) {
        console.log(e);
      }
    };

    getSchemaData();
  }, [params.address, params.schema]);
  return (
    <>
      <div className="m-10 mb-20">
        <div className="flex justify-start mb-5">
          <BackButton />
        </div>
        <div className="flex justify-center px-4 md:px-0">
          <div className="overflow-x-auto w-full shadow-2xl rounded-xl">
            <table className="table text-xl bg-base-100 table-zebra w-full md:table-md table-sm">
              <thead>
                <tr className="rounded-xl text-sm text-base-content">
                  <th className="bg-primary">Address</th>
                  {columns?.map((i: any) => (
                    <>
                      <th className="bg-primary" key={i}>
                        {fromHex(i, "string")}
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr key={1}>
                  {data?.map(
                    (
                      i:
                        | string
                        | number
                        | boolean
                        | ReactElement<any, string | JSXElementConstructor<any>>
                        | Iterable<ReactNode>
                        | ReactPortal
                        | PromiseLikeOfReactNode
                        | null
                        | undefined,
                      index: number,
                    ) => (
                      <>
                        {index == 0 ? (
                          <td className="md:py-4">
                            <Address address={String(params.address)} size="sm" />
                          </td>
                        ) : (
                          <td>{i?.toString()}</td>
                        )}
                      </>
                    ),
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddressPage;
