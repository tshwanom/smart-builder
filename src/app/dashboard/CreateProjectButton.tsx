
'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateProjectModal } from '@/modules/project/presentation/components/CreateProjectModal'

export const CreateProjectButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow hover:shadow-lg transform active:scale-95"
      >
        <Plus size={20} />
        New Project
      </button>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
