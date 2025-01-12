import { Session, User } from "@supabase/supabase-js";
import { log_event } from "../logging.js";
import { supabase } from "./client.js";
import { getConfigValue, updateConfigValue } from "./config-value.js";

export type AuthSuccessResult = { user: User, session: Session };

export async function performAuth(email: string, password: string): Promise<AuthSuccessResult | undefined> {
    console.log(`Signing in as ${email}...`);
    
    const auth = await supabase().auth.signInWithPassword({
        email,
        password
    })
    
    if (auth.error) {
        await log_event("error", "cloud:auth", "failed", { error: auth.error.message });
        console.error("Authentication failed:", auth.error.message);
        return undefined
    }

    console.log(`Signed in as ${email}...`);

    return { user: auth.data.user, session: auth.data.session }
}

export async function getCloudConfigValue(configName: string, projectId: string) {
    await log_event("info", "cloud:update-config-value", "start", { configName, projectId: projectId });
  
    const res = await getConfigValue(configName, projectId)
    console.log('Config was fetched from cloud: ');
    console.log(res);
    
    await log_event("info", "cloud:update-config-value", "end", { configName, projectName: projectId });
}
  
export async function setCloudConfigValue (configName: string, projectId: string, json: string) {
    await log_event("info", "cloud:get-config-value", "start", { configName, projectId: projectId });

    await updateConfigValue(configName, projectId, json)

    // TODO: Implement cloud config fetch
    await log_event("info", "cloud:get-config-value", "end", { configName, projectName: projectId });
}
