
export interface TileSpecification {
  material: 'CERAMIC' | 'PORCELAIN' | 'STONE';
  size: { length: number; width: number; thickness: number };
  finish: 'MATT' | 'GLOSS' | 'SATIN';
  installation: {
    pattern: 'STACK' | 'BRICK' | 'DIAGONAL';
    groutColor: string;
    movementJoints: boolean;
  };
}

export interface PaintSpecification {
  components: {
    primer: string; // Product ID
    undercoat?: string;
    topCoat: string;
  };
  coats: number;
}

export interface RoomFinishDomain {
  id: string;
  roomId: string;
  projectId: string;
  
  floor: {
    finishId?: string;
    skirtingId?: string;
    spec?: TileSpecification | any; // For overrides
  };
  
  walls: {
    finishId?: string;
    featureWalls?: { wallId: string; finishId: string }[];
    spec?: PaintSpecification | any;
  };
  
  ceiling: {
    finishId?: string;
    corniceId?: string;
  };
}
