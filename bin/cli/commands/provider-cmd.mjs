export function registerProvider(program) {
  program
    .command("provider [subcommand]")
    .description("Manage provider connections (use 'providers' for the full interface)")
    .allowUnknownOption()
    .allowExcessArguments()
    .action(() => {
      console.log(`
  Use \`aera-router providers\` for the full provider management interface:

    aera-router providers available   — show provider catalog
    aera-router providers list        — list configured connections
    aera-router providers test <name> — test a provider connection
    aera-router providers test-all    — test all active connections
    aera-router providers validate    — validate local configuration
`);
    });
}
