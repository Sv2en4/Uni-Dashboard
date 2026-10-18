import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Module } from '@/lib/types'

// TanStack Query caches the data under this key. After every change we
// "invalidate" it, which reloads the list everywhere it is shown.
export const MODULES_KEY = ['modules']

export function useModules() {
  return useQuery({
    queryKey: MODULES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Module[]
    },
  })
}

export type ModuleInput = Pick<Module, 'name' | 'kuerzel' | 'farbe'>

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ModuleInput) => {
      const { error } = await supabase.from('modules').insert(input)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MODULES_KEY }),
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...changes }: Partial<Module> & { id: string }) => {
      const { error } = await supabase.from('modules').update(changes).eq('id', id)
      if (error) throw error
    },
    // module_status (stage 6) also depends on modules
    onSettled: () => qc.invalidateQueries(),
  })
}
