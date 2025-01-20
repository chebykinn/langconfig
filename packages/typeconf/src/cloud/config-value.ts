import { supabase } from "./client.js"

async function getOrCreateProjectConfig(configName: string, projectId: string): Promise<{ id: string }> {
    // First get the project config id
    const { data: projectConfig, error: projectConfigError } = await supabase()
        .from('project_configs')
        .select('id')
        .eq('project', projectId)
        .eq('name', configName)
        .maybeSingle()

    if (projectConfigError) {
        throw new Error("Can't perform project config search", { cause: projectConfigError })
    }

    if (!projectConfig) {
        // Create new project config if it doesn't exist
        const { data: newProjectConfig, error: createError } = await supabase()
            .from('project_configs')
            .insert({
                project: projectId,
                name: configName
            })
            .select('id')
            .single()

        if (createError) {
            throw new Error("Failed to create project config", { cause: createError })
        }

        return newProjectConfig
    }

    return projectConfig
}

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
    const projectConfig = await getOrCreateProjectConfig(configName, projectId)

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

    return newConfigValue.version
}
