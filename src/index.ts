import * as core from "@actions/core";
import { IgorSetup } from "$/lib/igor-setup";

export async function run() {
  try {
    const accessKey = core.getInput("access-key", { required: true });
    
    let targetRuntime = core.getInput("runtime-version");
    const targetYyp = core.getInput("target-yyp");

    if (targetRuntime && targetYyp) {
      core.warning("Both runtime-version and target-yyp are specified. Using runtime-version.");
    } else if (!targetRuntime && !targetYyp) {
      throw new Error("You must specify either runtime-version or target-yyp");
    } else if (targetYyp) {
      core.info(`Inferring runtime from target-yyp: ${targetYyp}`);
      targetRuntime = await IgorSetup.getRuntimeBasedOnYyp(targetYyp);
    }

    const localSettingsOverrideFile = core.getInput("local-settings-override-file");
    const devicesOverrideFile = core.getInput("devices-settings-override-file");

    let targetModules: string[] | undefined;
    const modulesInput = core.getInput("modules");
    if (modulesInput) {
      try {
        targetModules = modulesInput.split(",");
        targetModules = targetModules.map(module => module.trim());
      } catch (error) {
        throw new Error(`Failed to parse modules input: ${error.message}`);
      }
    }

    const igorSetup = new IgorSetup(
      accessKey,
      targetRuntime!,
      localSettingsOverrideFile,
      devicesOverrideFile
    );

    await igorSetup.ensureIgorBootStrapperBasedOnOs();
    igorSetup.installModules(targetModules);

    core.info(`Installed modules: ${igorSetup.targetModules.join(",")}`);
    core.info(`For runtime: ${targetRuntime!}`);

    core.setOutput("cache-dir", igorSetup.cacheDir);
    core.setOutput("temp-dir", igorSetup.tempDir);
    core.setOutput("runtime-dir", igorSetup.targetRuntimeDir);
    core.setOutput("user-dir", igorSetup.userDir);
    core.setOutput("settings-dir", igorSetup.workingDirLocalSettings);
    core.setOutput("bootstrapper-dir", igorSetup.bootstrapperDir);
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
