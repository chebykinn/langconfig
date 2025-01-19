#!/usr/bin/env node

import { Command } from "commander";
import {compilePackage, initPackage, VERSION} from "./index.js";
import { getCloudConfigValue, setCloudConfigValue } from "./cloud/cli.js";

const program = new Command();

program
  .version(VERSION)
  .description("A CLI tool for writing configs with types");

program
  .command("init [directory]", { isDefault: false })
  .description("Init new configuration package")
  .action(async (directoryRaw) => {
    await initPackage(directoryRaw);
  });

program
  .command("build <configDir>", { isDefault: false })
  .option(
    "--watch",
    "Run in background and automatically recompile on changes",
    false,
  )
  .description("Compile the configuration package")
  .action(async (configDirRaw: string, options: any) => {
    await compilePackage(configDirRaw, options.watch ?? false);
  });

let cloud = program
  .command("cloud")
  .description("Cloud-related commands")

cloud
  .command("update-config-value <configName>")
  .requiredOption("--project <id>", "Project id")
  .requiredOption("--json <json>", "Json value")
  .description("Update configuration in cloud")
  .action(async (configName: string, options: { project: string, json: string }) => {
    await setCloudConfigValue(configName, options.project, options.json)
  });

cloud
  .command("get-config-value <configName>")
  .requiredOption("--project <id>", "Project id")
  .description("Fetch configuration from cloud")
  .action(async (configName: string, options: { project: string }) => {
    await getCloudConfigValue(configName, options.project)
  });

program.parse(process.argv);
