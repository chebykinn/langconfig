import { AuthError } from "@supabase/supabase-js";
import { log_event } from "../logging.js";
import { AuthSuccessResult, signIn, tryPerformAuthWithSessionFile } from "./auth.js";
import { getConfigValue, updateConfigValue } from "./config-value.js";
import prompts from "prompts";

async function withCommandLogging<T>(
    command: string,
    params: Record<string, any>,
    fn: () => Promise<T>
): Promise<T> {
    try {
        await log_event("info", command, "start", params);
        const result = await fn();
        await log_event("info", command, "end", params);
        return result;
    } catch (error) {
        await log_event("error", command, "failed", {
            ...params,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

export async function performAuth(): Promise<AuthSuccessResult | undefined> {
    let res = tryPerformAuthWithSessionFile()
    if (await res) {
        console.log('Using existing session...');
        return res;
    }

    const { email, password } = await prompts([
        {
            type: 'text',
            name: 'email',
            message: 'Enter your email:'
        },
        {
            type: 'password',
            name: 'password', 
            message: 'Enter your password:'
        }
    ]);

    console.log(`Signing in as ${email}...`);
    const authRes = await signIn(email, password)
    
    if (authRes instanceof AuthError) {
        await log_event("error", "cloud:auth", "failed", { error: authRes.message });
        console.error("Authentication failed:", authRes.message);
        return undefined
    }

    console.log(`Signed in as ${email}...`);

    return { user: authRes.user, session: authRes.session }
}

export async function getCloudConfigValue(configName: string, projectId: string) {
    await withCommandLogging(
        "cloud:get-config-value",
        { configName, projectId },
        async () => {
            await performAuth()

            const res = await getConfigValue(configName, projectId);
            console.log('Config was fetched from cloud: ');
            console.log(res);
        }
    );
}
  
export async function setCloudConfigValue(configName: string, projectId: string, json: string) {
    await withCommandLogging(
        "cloud:set-config-value",
        { configName, projectId },
        async () => {
            await performAuth()

            try {
                const res = await updateConfigValue(configName, projectId, json);
                console.log(`Config value updated successfully. New revision: ${res as number}`);
            } catch (err) {
                console.log('Failed to update config value:', err);
            }
        }
    );
}