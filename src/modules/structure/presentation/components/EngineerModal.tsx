
import React, { useState } from 'react';
import { useCanvasStore } from '@/modules/canvas/application/store';
import { StructureElementDomain, StructureProfile } from '@/modules/structure/domain/StructureTypes';

interface EngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementId?: string; // If editing existing
}

export const EngineerModal: React.FC<EngineerModalProps> = ({ isOpen, onClose, elementId }) => {
  const structureElements = useCanvasStore((state) => state.structureElements);
  const addStructureElement = useCanvasStore((state) => state.addStructureElement);
  const updateStructureElement = useCanvasStore((state) => state.updateStructureElement);

  const element = elementId ? structureElements.find(e => e.id === elementId) : null;

  const [type, setType] = useState(element?.type || 'COLUMN');
  const [designMode, setDesignMode] = useState(element?.designMode || 'STANDARD');
  const [profileName, setProfileName] = useState(element?.parsedProfile?.name || 'Standard 400x400');
  
  if (!isOpen) return null;

  const handleSave = () => {
    const newElement: Partial<StructureElementDomain> = {
       type: type as any,
       designMode: designMode as any,
       parsedProfile: {
           name: profileName,
           shape: 'RECT',
           dimensions: { dimA: 400, dimB: 400 } // Hardcoded for prototype
       }
    };

    if (elementId) {
        updateStructureElement(elementId, newElement);
    } else {
        // Add new logic (requires points)
        // For now, this modal is likely triggered AFTER placing points
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Structural Engineer Mode</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Element Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="COLUMN">RC Column</option>
            <option value="BEAM">RC Beam</option>
            <option value="SLAB">Suspended Slab</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Design Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                checked={designMode === 'STANDARD'} 
                onChange={() => setDesignMode('STANDARD')}
                className="mr-2"
              />
              Standard (SANS 10400)
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                checked={designMode === 'ENGINEER'} 
                onChange={() => setDesignMode('ENGINEER')}
                className="mr-2"
              />
              Rational Design
            </label>
          </div>
        </div>

        <div className="mb-6">
           <label className="block text-sm font-medium mb-1">Profile</label>
           <input 
             type="text" 
             value={profileName}
             onChange={(e) => setProfileName(e.target.value)}
             className="w-full border p-2 rounded" 
           />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Specification</button>
        </div>
      </div>
    </div>
  );
};
