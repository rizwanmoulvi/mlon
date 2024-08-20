"use client";

import { useEffect, useState } from "react";
import { CreateSchema } from "./_components/schema/CreateSchema";
import { SchemaDetails } from "./_components/schema/SchemaDetails";
import type { NextPage } from "next";
import { Abi, WalletClient, createPublicClient, createWalletClient, getContract } from "viem";
import { opBNBTestnet } from "viem/chains";
import { custom, http } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

const Home: NextPage = () => {
  const [schemas, setSchemas] = useState<any>();
  const [odl, setOdl] = useState<any>();

  useEffect(() => {
    let walletClient: WalletClient;
    if (window.ethereum) {
      walletClient = createWalletClient({
        chain: opBNBTestnet,
        transport: custom(window.ethereum as any),
      });
    }

    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const getSchemas = async () => {
      try {
        const userAnalyticsContractData = getContract({
          abi: deployedContracts[5611].DataLayer.abi as Abi,
          address: deployedContracts[5611].DataLayer.address,
          client: { public: publicClient, wallet: walletClient },
        });
        setOdl(userAnalyticsContractData);

        const schemas_ = await userAnalyticsContractData.read.getAllSchemas();

        console.log(schemas_);
        setSchemas(schemas_);
      } catch (e) {
        console.log(e);
      }
    };

    getSchemas();
  }, []);

  return (
    <>
      <div className="flex items-center bg-black flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-9xl text-mg font-bold">MLON Engine</span>
            <span className="block text-4xl  mt-5 text-mg mb-2 font-bold">OnChain Machine Learning Engine</span>
            <div className="padding"></div>
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-10 w-full max-w-7xl">
          <div className="z-10">
            <div className="rounded-3xl  flex flex-col mt-10 relative">
              <p className="text-5xl text-mg font-bold">Create A Data Schema</p>
              <div className="p-5divide-y divide-base-300">
                <CreateSchema odl={odl} />
              </div>
            </div>
          </div>
          <div className="z-10">
            <div className="adafelbg bg-base-100 rounded-3xl  border-base-300 flex flex-col mt-10 relative"></div>
            <div className="p-5 mt-10  divide-y divide-base-100 h-3/5 ">
              {" "}
              {/*overflow-scroll*/}
              {/* Use only if required overflow-scroll */}
              <SchemaDetails schemaList={schemas} odl={odl} />
            </div>
          </div>
        </div>

        <div className="flex-grow w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row"></div>
        </div>
      </div>
    </>
  );
};

export default Home;
