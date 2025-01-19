import { supabase } from "./client.js"

export async function getConfigValue(configName: string, projectId: string): Promise<string> {
    const { data, error } = await supabase()
        .from('config_values')
        .select(`
            value,
            project_configs!inner (
                id
            )
        `)
        .eq('project_configs.project', projectId)
        .eq('project_configs.name', configName)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (!data) {
        throw new Error('Config value not found')
    }

    return data.value as string
}

export async function updateConfigValue(configName: string, projectId: string, newValue: string): Promise<number> {
    // First get the project config id
    const { data: projectConfig, error: projectConfigError } = await supabase()
        .from('project_configs')
        .select('id')
        .eq('project', projectId)
        .eq('name', configName)
        .single()

    if (projectConfigError) {
        throw new Error("Can't find project config", { cause: projectConfigError })
    }

    if (!projectConfig) {
        throw new Error('Project config not found')
    }

    // Insert the new value
    const { data: newConfigValue, error: insertError } = await supabase()
        .from('config_values')
        .insert({
            config_id: projectConfig.id,
            value: newValue,
        })
        .select('version')
        .single()

    if (insertError) {
        throw new Error("Can't update config value", { cause: insertError })
    }

    return newConfigValue.version as number
}
