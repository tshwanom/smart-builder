
import React from 'react';
import { Group, Rect, Circle, Line, Text } from 'react-konva';
import { useCanvasStore } from '@/modules/canvas/application/store';
import { StructureElementDomain } from '@/modules/structure/domain/StructureTypes';

interface StructureRendererProps {
  scale: number;
}

export const StructureRenderer: React.FC<StructureRendererProps> = ({ scale }) => {
  const structureElements = useCanvasStore((state) => state.structureElements);
  const selectedElement = useCanvasStore((state) => state.selectedElement); // Assuming standardized selection

  return (
    <Group name="structure-layer">
      {structureElements.map((element) => (
        <StructureElementGroup 
          key={element.id} 
          element={element} 
          scale={scale}
        />
      ))}
    </Group>
  );
};

interface ElementProps {
  element: StructureElementDomain;
  scale: number;
}

const StructureElementGroup: React.FC<ElementProps> = ({ element, scale }) => {
  // Logic to render based on element.type and element.parsedPoints
  // For now, simple placeholders
  
  if (element.type === 'COLUMN') {
    const { start } = element.parsedPoints;
    const width = element.parsedProfile.dimensions.dimA || 400; // mm
    const depth = element.parsedProfile.dimensions.dimB || 400; // mm
    
    return (
      <Group x={start.x} y={start.y}>
        <Rect
          width={width}
          height={depth}
          fill="#4A5568" // Gray-700
          stroke="black"
          strokeWidth={2}
          offsetX={width / 2}
          offsetY={depth / 2}
        />
        <Text
            text={element.label || 'C'}
            fontSize={12 * (1/scale)} // Scale invariant text size
            fill="white"
            offsetX={5}
            offsetY={5}
        />
      </Group>
    );
  }

  if (element.type === 'BEAM') {
      const { start, end } = element.parsedPoints;
      return (
          <Line
            points={[start.x, start.y, end.x, end.y]}
            stroke="#2D3748" // Gray-800
            strokeWidth={element.parsedProfile.dimensions.width || 200}
            lineCap="butt"
          />
      )
  }

  return null;
};
