"use client";

import { useState } from "react";
import { DataTable, SearchBar } from "./_components";
import { ComputeData } from "./_components/ComputeData";
import type { NextPage } from "next";
import { fromHex } from "viem";

type PageProps = {
  params: { schema: string };
};

const BlockExplorer: NextPage<PageProps> = ({ params }: PageProps) => {
  const schemaName = params.schema;

  const [section, selectedSection] = useState("visualize");

  return (
    <div className="container mx-auto my-10">
      <h1 className="text-center">
        <span className="block text-2xl mb-2 des">{fromHex(schemaName as `0x${string}`, "string")} Table</span>
        {/* <div className="padding"></div> */}
      </h1>
      <div className="flex justify-center md:px-5 mb-5 gap-x-5">
        <button
          className={`catbutton font-light hover:border-transparent ${
            "visualize" === section ? "text-white buttoneffect" : "text-gray-300"
          }`}
          onClick={() => selectedSection("visualize")}
        >
          Visualize Data
        </button>
        <button
          className={`catbutton font-light hover:border-transparent ${
            "compute" === section ? "text-white buttoneffect" : "text-gray-300"
          }`}
          onClick={() => selectedSection("compute")}
        >
          Compute Data
        </button>
      </div>

      {section == "visualize" ? (
        <div>
          <SearchBar schema={schemaName} />
          <DataTable schema={schemaName} />
        </div>
      ) : (
        <ComputeData schema={schemaName} />
      )}
      {/* <PaginationButton currentPage={currentPage} totalItems={totalItems} setCurrentPage={setCurrentPage} /> */}
    </div>
  );
};

export default BlockExplorer;
