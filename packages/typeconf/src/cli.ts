#!/usr/bin/env node

import { Command } from "commander";
import {compilePackage, initPackage, VERSION} from "./index.js";
import { log_event } from "./logging.js";
import { getConfigValue, updateConfigValue } from "./cloud/config-value.js";
import { getCloudConfigValue, performAuth } from "./cloud/cli.js";

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
  .requiredOption("--email <email>", "Email")
  .requiredOption("--password <password>", "Password")

cloud
  .command("update-config-value <configName>")
  .requiredOption("--project <id>", "Project id")
  .requiredOption("--json <json>", "Json value")
  .description("Update configuration in cloud")
  .action(async (configName: string, options: { projectId: string, json: string }) => {
    await log_event("info", "cloud:update-config-value", "start", { configName, projectId: options.projectId });

    await updateConfigValue(configName, options.projectId, options.json)
    
    await log_event("info", "cloud:update-config-value", "end", { configName, projectName: options.projectId });
  });

cloud
  .command("get-config-value <configName>")
  .requiredOption("--project <id>", "Project id")
  .description("Fetch configuration from cloud")
  .action(async (configName: string, options: { project: string }) => {
    await log_event("info", "cloud:get-config-value", "start", { configName, projectId: options.project });

    await performAuth(cloud.opts().email, cloud.opts().password)
    await getCloudConfigValue(configName, options.project)

    // TODO: Implement cloud config fetch
    await log_event("info", "cloud:get-config-value", "end", { configName, projectName: options.project });
  });

program.parse(process.argv);
