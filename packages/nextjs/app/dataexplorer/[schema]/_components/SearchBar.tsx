"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";

export const SearchBar = ({ schema }: any) => {
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

  // const client = usePublicClient({ chainId: hardhat.id });

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAddress(searchInput)) {
      router.push(`/dataexplorer/${schema}/address/${searchInput}`);
      return;
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center justify-end mb-5 space-x-3 mx-5">
      <input
        className="border border-mg bg-black text-base-content p-2 mr-2 w-full md:w-1/2 lg:w-1/3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
        type="text"
        value={searchInput}
        placeholder="Search data by address"
        onChange={e => setSearchInput(e.target.value)}
      />
      <button className="btn btn-sm btn-primary bg-black border text-mg border-mg hover:bg-mg" type="submit">
        Search
      </button>
    </form>
  );
};
