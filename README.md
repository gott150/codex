# Codex

This repository houses experimental multi-agent tooling for the Codex CLI.

The TypeScript implementation lives in `codex-cli/` and provides a flow-based orchestrator with YAML definitions, streaming output, and a pluggable provider and tool architecture.

## Quick start

```bash
pnpm install
cd codex-cli
pnpm build
pnpm test
codex-flow flow run flows/examples/code-assistant.flow.yaml -i "Hello" --profile local
```

That command executes the example flow consisting of planner → coder → critic agents and streams tokens to the terminal.

## Project layout

```
.
├─ codex-cli/         # CLI package
│  ├─ bin/            # yargs entrypoint
│  ├─ src/            # orchestrator, agents, tools
│  ├─ flows/          # sample flow definitions
│  └─ config/         # default settings and profiles
└─ codex-rs/          # (rust prototype, not covered here)
```

## Scripts

From the `codex-cli/` directory:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`

## Global usage

```bash
pnpm -C codex-cli build
pnpm -C codex-cli link -g
codex-flow --help

pnpm unlink -g @openai/codex || true
hash -r 2>/dev/null || true
```

## License

Licensed under the [Apache-2.0 License](LICENSE).
