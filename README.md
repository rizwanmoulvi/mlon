# MLON ENGINE

MLON engine is an onchain ML agent built to provide data collection, extraction, and computation on top of BSC Chain. The major components of the MLON engine include -

- Data lake where the users contribute data and get incentivized onchain
- ML agent contracts - ML smart contracts directly pluggable into the onchain Data lake and are trained on top of the Data lake schemas
- Prediction engine - Once the ML models are trained they can be directly used for predictions on top of onchain and off-chain data
- LLM inference engine - this engine is built on top of Lilypad to draw general inferences from the data.
  All these components combined create an end-to-end ML engine where the users can build ML agents dapps on top of it.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

## Quickstart

yarn install

yarn chain

yarn deploy

yarn start




