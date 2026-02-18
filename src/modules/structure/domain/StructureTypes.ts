
import { StructureElement, Project } from "@prisma/client";

export type StructureType = "COLUMN" | "BEAM" | "SLAB" | "FOUNDATION";
export type DesignMode = "STANDARD" | "ENGINEER";

export interface StructureProfile {
  name: string;      // "IPE 200" or "400x400 Custom"
  shape: string;     // "I-SECTION", "RECT", "CIRCULAR", "L-SHAPE"
  dimensions: Record<string, number>; // { depth: 200, width: 100, web: 5.6 }
  properties?: {
    massPerMeter?: number;
    area?: number;
    inertia?: number;
  };
}

export interface RebarSpecification {
  mainBarCount: number;
  mainBarSize: string; // "Y12"
  linkSize: string;    // "R8"
  linkSpacing: number; // 200
  totalMass?: number;  // Calculated
}

export interface GeometricPoints {
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  polygon?: { x: number; y: number }[]; // For slabs
}

export interface StructureElementDomain extends StructureElement {
  parsedProfile: StructureProfile;
  parsedPoints: GeometricPoints;
  parsedRebar?: RebarSpecification;
}
