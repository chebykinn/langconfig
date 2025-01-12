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

export async function updateConfigValue(configName: string, projectId: string, newValue: string): Promise<void> {
}
