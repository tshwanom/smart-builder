import { useState, useEffect, useCallback } from 'react'
import { WallTemplate } from '../../application/types'

export { type WallTemplate }

export function useWallTemplates(projectId: string | null) {
  const [templates, setTemplates] = useState<WallTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (projectId) params.append('projectId', projectId)
      
      const res = await fetch(`/api/walls/templates?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch templates')
      
      const data = await res.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const createTemplate = async (templateData: Partial<WallTemplate>) => {
    try {
      const res = await fetch('/api/walls/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...templateData, projectId })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create template')
      }
      await fetchTemplates()
      return await res.json()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const updateTemplate = async (id: string, templateData: Partial<WallTemplate>) => {
    try {
      const res = await fetch(`/api/walls/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      if (!res.ok) throw new Error('Failed to update template')
      await fetchTemplates()
      return await res.json()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/walls/templates/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete template')
      await fetchTemplates()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  return { 
    templates, 
    loading, 
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: fetchTemplates 
  }
}
