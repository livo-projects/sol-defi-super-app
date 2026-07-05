# Indexers

Goldsky subgraphs live here, one full subgraph project per subdirectory
(`subgraph.yaml` + `schema.graphql` + `src/mapping.ts` + `abis/` + `indexer.yaml`).

Empty until you add one. Deploy a contract, then run `scaffold_indexer` (or
`create_indexer`) to generate `indexers/<name>/` from its ABI — `sync_indexers`
then builds + deploys every subgraph here. A hand-authored `subgraph.yaml` is
deployed as-is.
