# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume VII — Foundation System: Dual-Mode Engineering Parameters & BOQ Integration

**Version:** 7.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification  

---

# 1. Document Control

- **Version:** 7.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** __________________

---

# 2. Scope

Volume VII defines the **Foundation Parameter System with Dual-Mode Engineering Controls** for the SVG-Based Parametric CAD & BOQ Platform.

This document establishes:

- **Standard Mode**: Automatic SANS-compliant foundation design using minimum requirements
- **Engineer Mode**: Advanced parametric controls for custom structural design
- Foundation type classification and parametric data models
- Soil classification and bearing capacity integration
- Foundation geometry calculation algorithms
- BOQ derivation from foundation parameters
- SANS 10400-H and SANS 10100-1 compliance enforcement
- Material wastage and overlap calculations
- Foundation-specific rendering in plan and section views
- Engineer modal interface specification for walls, openings, slabs, and roofs

---

# 3. Strategic Objective

The foundation system must:

- **Operate in two modes**: Standard (auto-compliance) and Engineer (custom design)
- Generate SANS-compliant engineering drawings automatically
- Allow engineers to override with custom designs when needed
- Automatically calculate foundation geometry based on soil class and building loads
- Generate accurate BOQ for all foundation materials
- Ensure SANS compliance for South African projects
- Support multi-country foundation standards via StandardConfig
- Integrate seamlessly with wall, slab, and roof geometry engines
- Provide section views showing foundation depth and construction details

---

# 4. Dual-Mode System Architecture

## 4.1 Mode Definition

```ts
type DesignMode = 'standard' | 'engineer';

interface DesignModeConfig {
  mode: DesignMode;
  autoCompliance: boolean;
  engineerOverride: boolean;
  requiresApproval: boolean;
  engineerSignature?: {
    name: string;
    registrationNumber: string;
    date: Date;
    stamp: string; // Digital signature/stamp
  };
}
```

## 4.2 Mode Selection UI Flow

```
User Creates Element (Wall/Foundation/Opening/Slab/Roof)
    ↓
┌─────────────────────────────────────┐
│  Select Design Mode                 │
│  ○ Standard (SANS Auto-Compliant)   │
│  ○ Engineer (Custom Design)         │
└─────────────────────────────────────┘
    ↓
Mode: Standard               Mode: Engineer
    ↓                             ↓
Auto-calculate using         Open Engineer Modal
minimum SANS requirements    (Advanced Parameters)
    ↓                             ↓
Generate Geometry            Custom Design Input
    ↓                             ↓
Generate BOQ                 Validate Against SANS
    ↓                             ↓
Ready for Drawing            Generate Geometry
                                  ↓
                            Generate BOQ
                                  ↓
                            Require Engineer Signature
                                  ↓
                            Ready for Drawing
```

---

# 5. Foundation Type Classification

```ts
type FoundationType = 
  | 'strip_footing'
  | 'pad_footing'
  | 'raft'
  | 'pile'
  | 'slab_on_ground';

interface FoundationConfig {
  type: FoundationType;
  designMode: DesignModeConfig;
  soilClass: 'H1' | 'H2' | 'H3' | 'H4' | 'S'; // SANS 10400-H
  bearingCapacity: number; // kPa
  minimumFoundingDepth: number; // mm
  frostLine: number; // mm (location-dependent)
}
```

---

# 6. Standard Mode: Auto-Compliant Foundation Parameters

## 6.1 Standard Mode Strip Footing

```ts
interface StandardStripFooting {
  id: string;
  designMode: 'standard';
  wallId: string;
  
  // Auto-calculated from soil class
  soilClass: 'H1' | 'H2' | 'H3' | 'H4' | 'S';
  bearingCapacity: number; // Auto-assigned
  
  // Auto-calculated from wall load
  width: number; // Auto: min required width
  depth: number; // Auto: 300mm standard
  foundingLevel: number; // Auto: from soil class table
  
  // Auto-assigned SANS minimum
  concrete: {
    grade: '20MPa'; // SANS minimum for foundations
    volume: number; // Auto-calculated
    overbreakAllowance: 7.5; // % standard
    cubeTests: number; // Auto: 1 per 20m³ or fraction
  };
  
  // Auto-assigned SANS minimum reinforcement
  reinforcement: {
    bottomBars: {
      size: 'Y12';
      spacing: 200; // mm c/c
      cover: 50; // mm SANS minimum
    };
    topBars: {
      size: 'Y10';
      spacing: 300; // mm c/c
    };
    starterBars: {
      size: 'Y12';
      length: 600; // mm into wall
      spacing: 400; // mm c/c
    };
  };
  
  // Auto-calculated
  dampProofing: {
    dpm: {
      thickness: '375micron'; // SANS standard
      overlap: 150; // mm minimum
    };
    dpc: {
      type: '375micron';
    };
  };
}
```

## 6.2 Standard Mode Calculation Rules

```ts
const SANS_MINIMUM_REQUIREMENTS = {
  foundingDepth: {
    'H1': 750,  // mm
    'H2': 900,  // mm
    'H3': 1200, // mm
    'H4': 1500, // mm
    'S': 450    // mm (rock)
  },
  
  bearingCapacity: {
    'H1': 200, // kPa
    'H2': 150, // kPa
    'H3': 100, // kPa
    'H4': 75,  // kPa
    'S': 500   // kPa (rock)
  },
  
  stripFooting: {
    minimumWidth: 450,    // mm
    minimumDepth: 300,    // mm
    concreteGrade: '20MPa',
    concreteCover: 50,    // mm
    bottomRebar: 'Y12',
    topRebar: 'Y10',
    rebarSpacing: 200,    // mm c/c
  },
  
  slab: {
    minimumThickness: 100, // mm residential
    meshType: 'Ref193',
    meshOverlap: 300,      // mm
    concreteCover: 40,     // mm
  },
  
  dampProofing: {
    dpmThickness: '375micron',
    dpmOverlap: 150,       // mm
    dpcType: '375micron'
  }
};

function createStandardFoundation(
  wall: Wall,
  soilClass: string
): StandardStripFooting {
  const wallLoad = calculateWallLoad(wall); // kN/m
  const bearingCapacity = SANS_MINIMUM_REQUIREMENTS.bearingCapacity[soilClass];
  
  const requiredWidth = Math.max(
    calculateStripFootingWidth(wallLoad, bearingCapacity, 1.5),
    SANS_MINIMUM_REQUIREMENTS.stripFooting.minimumWidth
  );
  
  return {
    id: generateUUID(),
    designMode: 'standard',
    wallId: wall.id,
    soilClass,
    bearingCapacity,
    width: roundUpTo50mm(requiredWidth),
    depth: SANS_MINIMUM_REQUIREMENTS.stripFooting.minimumDepth,
    foundingLevel: SANS_MINIMUM_REQUIREMENTS.foundingDepth[soilClass],
    concrete: {
      grade: '20MPa',
      volume: calculateConcreteVolume(
        wall.length / 1000,
        requiredWidth / 1000,
        300 / 1000,
        7.5
      ),
      overbreakAllowance: 7.5,
      cubeTests: Math.ceil(calculateConcreteVolume(
        wall.length / 1000,
        requiredWidth / 1000,
        300 / 1000,
        0
      ) / 20)
    },
    reinforcement: {
      bottomBars: {
        size: 'Y12',
        spacing: 200,
        cover: 50
      },
      topBars: {
        size: 'Y10',
        spacing: 300
      },
      starterBars: {
        size: 'Y12',
        length: 600,
        spacing: 400
      }
    },
    dampProofing: {
      dpm: {
        thickness: '375micron',
        overlap: 150
      },
      dpc: {
        type: '375micron'
      }
    }
  };
}
```

---

# 7. Engineer Mode: Advanced Foundation Parameters

## 7.1 Engineer Mode Strip Footing

```ts
interface EngineerStripFooting {
  id: string;
  designMode: 'engineer';
  wallId: string;
  
  // Engineer-specified soil parameters
  soilClass: 'H1' | 'H2' | 'H3' | 'H4' | 'S' | 'custom';
  customSoilProperties?: {
    description: string;
    bearingCapacity: number; // kPa
    soilType: string;
    plasticity: string;
    foundingDepthRequired: number; // mm
    geotechReportRef: string;
  };
  
  // Engineer-specified geometry
  width: number; // mm - custom
  depth: number; // mm - custom
  foundingLevel: number; // mm - custom
  shape: 'rectangular' | 'stepped' | 'tapered';
  
  // Engineer-specified concrete
  concrete: {
    grade: '15MPa' | '20MPa' | '25MPa' | '30MPa' | '40MPa';
    additives?: string[];
    specialRequirements?: string;
    volume: number; // Auto-calculated from geometry
    overbreakAllowance: number; // % - engineer specified
    cubeTests: number; // quantity - engineer specified
    slumpTest: boolean;
  };
  
  // Engineer-designed reinforcement
  reinforcement: {
    bottomBars: {
      size: 'Y10' | 'Y12' | 'Y16' | 'Y20' | 'Y25';
      spacing: number; // mm - custom
      cover: number; // mm - custom (min 50mm)
      length: number; // mm
      quantity: number;
      schedule?: string; // Bending schedule reference
    }[];
    topBars: {
      size: 'Y10' | 'Y12' | 'Y16' | 'Y20';
      spacing: number;
      cover: number;
      length: number;
      quantity: number;
    }[];
    stirrups?: {
      size: 'Y8' | 'Y10';
      spacing: number;
      quantity: number;
    }[];
    starterBars: {
      size: 'Y10' | 'Y12' | 'Y16' | 'Y20';
      length: number;
      spacing: number;
      hookType: 'standard' | '90deg' | '180deg';
    }[];
    additionalReinforcement?: {
      description: string;
      size: string;
      quantity: number;
      location: string;
    }[];
  };
  
  // Engineer-specified formwork
  formwork: {
    type: 'timber' | 'steel' | 'permanent';
    area: number; // Auto-calculated
    specialRequirements?: string;
  };
  
  // Engineer-specified dampproofing
  dampProofing: {
    dpm: {
      thickness: '250micron' | '375micron' | '500micron';
      overlap: number; // mm - custom (min 150mm)
      type: 'standard' | 'reinforced' | 'bituminous';
    };
    dpc: {
      type: '375micron' | '500micron' | 'torchOn' | 'bituminous';
      width: number; // mm
    };
    waterproofing?: {
      type: 'bituminous' | 'torchOn' | 'liquid' | 'cementitious';
      coats: number;
      area: number; // m²
    };
  };
  
  // Engineer notes and calculations
  designNotes: {
    loadCalculations: string;
    bearingPressureCheck: string;
    settlementAnalysis?: string;
    specialConsiderations?: string;
    drawingReferences?: string[];
  };
  
  // Engineer signature requirement
  engineerSignature: {
    required: true;
    name: string;
    registrationNumber: string; // ECSA registration
    company: string;
    date: Date;
    digitalStamp: string;
    approved: boolean;
  };
  
  // SANS compliance validation
  complianceOverride: {
    hasOverrides: boolean;
    overrideReasons: string[];
    justification: string;
    approvedBy: string;
  };
}
```

---

# 8. Engineer Modal Interface Specification

## 8.1 Engineer Modal Component Structure

```tsx
interface EngineerModalProps {
  elementType: 'foundation' | 'wall' | 'opening' | 'slab' | 'roof';
  elementId: string;
  standardParams: any; // Current standard parameters
  onSave: (engineerParams: any) => void;
  onCancel: () => void;
}

const EngineerModal: React.FC<EngineerModalProps> = ({
  elementType,
  elementId,
  standardParams,
  onSave,
  onCancel
}) => {
  return (
    <Modal size="xl" isOpen={true}>
      <ModalHeader>
        <div className="flex justify-between items-center">
          <h2>Engineer Design Mode: {elementType}</h2>
          <Badge variant="warning">
            Requires Engineer Signature
          </Badge>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <Tabs>
          <TabList>
            <Tab>Geometry</Tab>
            <Tab>Materials</Tab>
            <Tab>Reinforcement</Tab>
            <Tab>Loading</Tab>
            <Tab>Compliance</Tab>
            <Tab>Signature</Tab>
          </TabList>
          
          <TabPanels>
            {/* Geometry Tab */}
            <TabPanel>
              <GeometryParametersForm
                elementType={elementType}
                params={standardParams}
              />
            </TabPanel>
            
            {/* Materials Tab */}
            <TabPanel>
              <MaterialsSpecificationForm
                elementType={elementType}
              />
            </TabPanel>
            
            {/* Reinforcement Tab */}
            <TabPanel>
              <ReinforcementDesignForm
                elementType={elementType}
              />
            </TabPanel>
            
            {/* Loading Tab */}
            <TabPanel>
              <LoadCalculationsForm
                elementType={elementType}
              />
            </TabPanel>
            
            {/* Compliance Tab */}
            <TabPanel>
              <SANSComplianceValidator
                params={engineerParams}
                showOverrides={true}
              />
            </TabPanel>
            
            {/* Signature Tab */}
            <TabPanel>
              <EngineerSignatureForm
                onSign={handleSignature}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={!signatureValid}
        >
          Save Engineer Design
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

## 8.2 Foundation Engineer Modal Tabs

### Tab 1: Geometry Parameters

```tsx
interface FoundationGeometryForm {
  foundationType: FoundationType;
  
  // Soil Parameters
  soilClass: string;
  customSoil: boolean;
  bearingCapacity: number; // kPa
  foundingDepth: number; // mm
  geotechReference: string;
  
  // Geometry
  width: number; // mm
  depth: number; // mm
  length?: number; // mm (for pads)
  shape: 'rectangular' | 'stepped' | 'tapered';
  
  // Special Features
  hasKeyway: boolean;
  keywayDepth?: number;
  hasSteps: boolean;
  stepDetails?: StepDetail[];
}

const GeometryTab = () => (
  <FormGrid>
    <FormSection title="Soil Parameters">
      <Select
        label="Soil Class"
        options={['H1', 'H2', 'H3', 'H4', 'S', 'Custom']}
        tooltip="Select SANS soil classification or custom"
      />
      
      <NumberInput
        label="Bearing Capacity (kPa)"
        min={50}
        max={1000}
        tooltip="Safe bearing capacity from geotechnical report"
      />
      
      <NumberInput
        label="Founding Depth (mm)"
        min={450}
        tooltip="Depth below natural ground level"
      />
      
      <TextInput
        label="Geotech Report Reference"
        placeholder="e.g., GEO-2026-001"
      />
    </FormSection>
    
    <FormSection title="Foundation Geometry">
      <NumberInput
        label="Width (mm)"
        min={450}
        step={50}
        tooltip="Foundation width perpendicular to wall"
      />
      
      <NumberInput
        label="Depth/Thickness (mm)"
        min={200}
        step={50}
        tooltip="Vertical dimension of foundation"
      />
      
      <Select
        label="Shape"
        options={['Rectangular', 'Stepped', 'Tapered']}
      />
    </FormSection>
    
    <FormSection title="Special Features">
      <Checkbox
        label="Include Keyway"
        tooltip="Central keyway for additional shear resistance"
      />
      
      <Checkbox
        label="Stepped Foundation"
        tooltip="For sloping sites"
      />
    </FormSection>
    
    <SANSValidator
      show={true}
      validations={geometryValidations}
    />
  </FormGrid>
);
```

### Tab 2: Materials Specification

```tsx
const MaterialsTab = () => (
  <FormGrid>
    <FormSection title="Concrete Specification">
      <Select
        label="Concrete Grade"
        options={['15MPa', '20MPa', '25MPa', '30MPa', '40MPa']}
        defaultValue="20MPa"
        tooltip="Minimum 20MPa for foundations (SANS)"
      />
      
      <NumberInput
        label="Overbreak Allowance (%)"
        min={5}
        max={15}
        defaultValue={7.5}
        tooltip="Additional concrete for excavation tolerance"
      />
      
      <MultiSelect
        label="Additives (Optional)"
        options={[
          'Waterproofer',
          'Plasticizer',
          'Retarder',
          'Accelerator',
          'Fibers'
        ]}
      />
      
      <Checkbox
        label="Slump Test Required"
        defaultChecked={true}
      />
      
      <NumberInput
        label="Cube Tests"
        min={1}
        tooltip="1 per 20m³ or fraction (SANS minimum)"
      />
    </FormSection>
    
    <FormSection title="Damp Proofing">
      <Select
        label="DPM Thickness"
        options={['250 micron', '375 micron', '500 micron']}
        defaultValue="375 micron"
      />
      
      <NumberInput
        label="DPM Overlap (mm)"
        min={150}
        defaultValue={150}
        tooltip="Minimum 150mm (SANS)"
      />
      
      <Select
        label="DPC Type"
        options={['375 micron', '500 micron', 'Torch-on', 'Bituminous']}
      />
    </FormSection>
    
    <FormSection title="Waterproofing (Optional)">
      <Checkbox
        label="Additional Waterproofing Required"
      />
      
      <Select
        label="Waterproofing Type"
        options={['Bituminous', 'Torch-on', 'Liquid', 'Cementitious']}
      />
      
      <NumberInput
        label="Number of Coats"
        min={1}
        max={3}
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 3: Reinforcement Design

```tsx
const ReinforcementTab = () => (
  <FormGrid>
    <FormSection title="Bottom Reinforcement">
      <RebarLayerDesigner
        label="Bottom Bars"
        allowMultipleLayers={true}
      >
        <Select
          label="Bar Size"
          options={['Y10', 'Y12', 'Y16', 'Y20', 'Y25']}
        />
        
        <NumberInput
          label="Spacing (mm c/c)"
          min={100}
          max={400}
        />
        
        <NumberInput
          label="Cover (mm)"
          min={50}
          tooltip="Minimum 50mm for foundations (SANS)"
        />
        
        <NumberInput
          label="Length (mm)"
          tooltip="Including laps and hooks"
        />
        
        <NumberInput
          label="Quantity"
          readOnly={true}
          calculated={true}
        />
      </RebarLayerDesigner>
      
      <Button
        variant="outline"
        onClick={addRebarLayer}
      >
        + Add Layer
      </Button>
    </FormSection>
    
    <FormSection title="Top Reinforcement">
      <RebarLayerDesigner label="Top Bars">
        {/* Similar controls */}
      </RebarLayerDesigner>
    </FormSection>
    
    <FormSection title="Starter Bars">
      <Select
        label="Bar Size"
        options={['Y10', 'Y12', 'Y16', 'Y20']}
      />
      
      <NumberInput
        label="Length into Wall (mm)"
        min={400}
        defaultValue={600}
      />
      
      <NumberInput
        label="Spacing (mm c/c)"
        min={200}
        max={600}
      />
      
      <Select
        label="Hook Type"
        options={['Standard', '90° Bend', '180° Hook']}
      />
    </FormSection>
    
    <FormSection title="Stirrups/Links (If Required)">
      <Checkbox
        label="Include Stirrups"
      />
      
      <Select
        label="Bar Size"
        options={['Y8', 'Y10']}
      />
      
      <NumberInput
        label="Spacing (mm)"
      />
    </FormSection>
    
    <ReinforcementSummary
      totalMass={calculatedTotalMass}
      bendingSchedule={generateBendingSchedule()}
    />
  </FormGrid>
);
```

### Tab 4: Loading & Calculations

```tsx
const LoadingTab = () => (
  <FormGrid>
    <FormSection title="Load Input">
      <NumberInput
        label="Dead Load (kN/m)"
        tooltip="Self weight + permanent loads"
      />
      
      <NumberInput
        label="Live Load (kN/m)"
        tooltip="Imposed/variable loads"
      />
      
      <NumberInput
        label="Total Design Load (kN/m)"
        calculated={true}
        readOnly={true}
      />
      
      <NumberInput
        label="Load Factor"
        defaultValue={1.5}
        tooltip="SANS safety factor"
      />
    </FormSection>
    
    <FormSection title="Bearing Pressure Check">
      <CalculationDisplay
        label="Applied Bearing Pressure"
        value={appliedPressure}
        unit="kPa"
      />
      
      <CalculationDisplay
        label="Allowable Bearing Pressure"
        value={allowablePressure}
        unit="kPa"
      />
      
      <CalculationDisplay
        label="Safety Factor"
        value={safetyFactor}
        status={safetyFactor >= 1.5 ? 'pass' : 'fail'}
      />
      
      <ValidationBadge
        pass={safetyFactor >= 1.5}
        message={
          safetyFactor >= 1.5 
            ? 'Bearing capacity adequate' 
            : 'INCREASE FOUNDATION WIDTH'
        }
      />
    </FormSection>
    
    <FormSection title="Settlement Analysis (Optional)">
      <Checkbox
        label="Include Settlement Calculations"
      />
      
      <NumberInput
        label="Expected Settlement (mm)"
        tooltip="From geotechnical analysis"
      />
      
      <Select
        label="Settlement Category"
        options={['Negligible', 'Slight', 'Moderate', 'Severe']}
      />
    </FormSection>
    
    <FormSection title="Design Notes">
      <TextArea
        label="Load Calculation Notes"
        rows={4}
        placeholder="Document assumptions, load sources, and calculation methods..."
      />
      
      <TextArea
        label="Special Considerations"
        rows={4}
        placeholder="e.g., Tree roots, services, adjacent structures..."
      />
      
      <FileUpload
        label="Attach Calculations (PDF)"
        accept=".pdf"
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 5: SANS Compliance Validation

```tsx
const ComplianceTab = () => (
  <FormGrid>
    <ComplianceCheckList
      checks={[
        {
          rule: 'Minimum Founding Depth',
          standard: 'SANS 10400-H',
          requirement: `${requiredDepth}mm for soil class ${soilClass}`,
          actual: `${actualDepth}mm`,
          status: actualDepth >= requiredDepth ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Bearing Capacity Safety',
          standard: 'SANS 10400-H',
          requirement: 'Safety Factor ≥ 1.5',
          actual: `SF = ${calculatedSF}`,
          status: calculatedSF >= 1.5 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Concrete Cover',
          standard: 'SANS 10100-1',
          requirement: 'Minimum 50mm',
          actual: `${actualCover}mm`,
          status: actualCover >= 50 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Minimum Width',
          standard: 'SANS 10400-H',
          requirement: 'Minimum 450mm',
          actual: `${actualWidth}mm`,
          status: actualWidth >= 450 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'DPM Overlap',
          standard: 'SANS 10400-H',
          requirement: 'Minimum 150mm',
          actual: `${dpmOverlap}mm`,
          status: dpmOverlap >= 150 ? 'pass' : 'fail',
          override: false
        }
      ]}
    />
    
    <FormSection title="Compliance Overrides">
      <Alert variant="warning" show={hasOverrides}>
        Engineer override requires justification and signature
      </Alert>
      
      {failedChecks.map(check => (
        <OverrideControl
          key={check.rule}
          check={check}
          onOverride={(reason) => handleOverride(check, reason)}
        />
      ))}
    </FormSection>
    
    <FormSection title="Drawing References">
      <TextInput
        label="Detail Drawing Reference"
        placeholder="e.g., DRG-FND-001"
      />
      
      <MultiSelect
        label="Related Specifications"
        options={[
          'SANS 10400-H',
          'SANS 10100-1',
          'SANS 2001-CC1',
          'SANS 10160'
        ]}
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 6: Engineer Signature

```tsx
const SignatureTab = () => (
  <FormGrid>
    <Alert variant="info">
      All engineer-designed elements require professional engineer signature
      and ECSA registration number for SANS compliance.
    </Alert>
    
    <FormSection title="Engineer Details">
      <TextInput
        label="Full Name"
        required={true}
      />
      
      <TextInput
        label="ECSA Registration Number"
        required={true}
        pattern="[0-9]{6,8}"
        tooltip="Professional Engineer or Technologist registration"
      />
      
      <TextInput
        label="Company/Practice"
        required={true}
      />
      
      <TextInput
        label="Contact Number"
        required={true}
      />
      
      <TextInput
        label="Email"
        required={true}
        type="email"
      />
    </FormSection>
    
    <FormSection title="Design Declaration">
      <Checkbox
        label="I confirm that this design complies with SANS requirements"
        required={true}
      />
      
      <Checkbox
        label="I take professional responsibility for this design"
        required={true}
      />
      
      <Checkbox
        label="All calculations have been checked and verified"
        required={true}
      />
    </FormSection>
    
    <FormSection title="Digital Signature">
      <SignaturePad
        onSign={handleSignature}
        width={400}
        height={150}
      />
      
      <DatePicker
        label="Signature Date"
        value={new Date()}
        readOnly={true}
      />
      
      <FileUpload
        label="Upload Professional Stamp (Optional)"
        accept=".png,.jpg"
      />
    </FormSection>
    
    <FormSection title="Final Approval">
      <Button
        variant="primary"
        size="large"
        onClick={submitEngineerDesign}
        disabled={!allFieldsValid || !signatureValid}
      >
        Approve and Save Engineer Design
      </Button>
    </FormSection>
  </FormGrid>
);
```

---

# 9. Wall Engineer Modal

## 9.1 Wall Standard Parameters

```ts
interface StandardWall {
  designMode: 'standard';
  thickness: 230 | 140 | 115; // Standard brick/block dimensions
  height: number; // Auto from floor-to-floor
  type: 'external' | 'internal';
  
  // Auto SANS-compliant
  materialLayers: [
    { material: 'plaster', thickness: 15 },
    { material: 'brick', thickness: 230 },
    { material: 'plaster', thickness: 15 }
  ];
  
  // No structural design
  isLoadBearing: false;
}
```

## 9.2 Wall Engineer Parameters

```ts
interface EngineerWall {
  designMode: 'engineer';
  thickness: number; // Custom
  height: number; // Custom
  type: 'external' | 'internal' | 'shear' | 'retaining';
  
  // Structural classification
  structural: {
    isLoadBearing: boolean;
    wallCategory: 'plain' | 'reinforced' | 'shear';
    designLoad: number; // kN/m²
    momentCapacity?: number; // kNm
  };
  
  // Material specification
  materialLayers: {
    material: string;
    thickness: number; // mm
    strength?: string;
    finish?: string;
  }[];
  
  // Reinforcement (if reinforced masonry)
  reinforcement?: {
    vertical: {
      size: 'Y10' | 'Y12' | 'Y16';
      spacing: number; // mm
      grouted: boolean;
    };
    horizontal: {
      type: 'brickforce' | 'ladder' | 'truss';
      spacing: number; // mm (courses)
    };
  };
  
  // Movement joints
  movementJoints: {
    required: boolean;
    spacing: number; // mm
    type: 'expansion' | 'control';
  };
  
  engineerSignature: EngineerSignature;
}
```

## 9.3 Wall Engineer Modal Tabs

```
Tabs:
1. Wall Type & Classification
2. Material Layers
3. Structural Design (if load-bearing)
4. Reinforcement (if applicable)
5. Movement Joints
6. SANS Compliance
7. Engineer Signature
```

---

# 10. Opening Engineer Modal

## 10.1 Opening Standard Parameters

```ts
interface StandardOpening {
  designMode: 'standard';
  type: 'door' | 'window';
  width: number; // Standard sizes
  height: number; // Standard sizes
  
  // Auto lintel
  lintel: {
    type: 'precast' | 'cast-in-place';
    size: '200x75' | '230x75'; // Standard SANS sizes
    bearing: 150; // mm each side (SANS minimum)
  };
}
```

## 10.2 Opening Engineer Parameters

```ts
interface EngineerOpening {
  designMode: 'engineer';
  type: 'door' | 'window' | 'garage' | 'custom';
  width: number; // Custom
  height: number; // Custom
  
  // Lintel design
  lintel: {
    type: 'precast' | 'cast-in-place' | 'steel';
    depth: number; // mm
    width: number; // mm
    bearing: number; // mm each side
    
    // For engineered lintels
    reinforcement?: {
      topBars: RebarSpec[];
      bottomBars: RebarSpec[];
      stirrups: RebarSpec;
    };
    
    // For steel lintels
    steelSection?: {
      type: string; // e.g., 'IPE 200'
      length: number;
      coating: string;
    };
  };
  
  // Load calculation
  loading: {
    wallLoadAbove: number; // kN/m
    selfWeight: number; // kN
    totalLoad: number; // kN
    spanMoment: number; // kNm
  };
  
  // Frame specification
  frame?: {
    material: 'timber' | 'steel' | 'aluminium';
    fixingMethod: string;
    sealant: string;
  };
  
  engineerSignature: EngineerSignature;
}
```

## 10.3 Opening Engineer Modal Tabs

```
Tabs:
1. Opening Geometry
2. Lintel Design
3. Load Calculations
4. Frame Specification
5. SANS Compliance
6. Engineer Signature
```

---

# 11. Complete BOQ Integration

## 11.1 BOQ Differentiation by Design Mode

```ts
interface BOQItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
  wastage: number;
  totalQuantity: number;
  unitRate: number;
  totalCost: number;
  
  // New fields for engineer mode
  designMode: 'standard' | 'engineer';
  engineerRef?: string;
  customSpecification?: boolean;
}

function generateBOQ(element: any): BOQSection {
  if (element.designMode === 'standard') {
    return generateStandardBOQ(element);
  } else {
    return generateEngineerBOQ(element);
  }
}

function generateEngineerBOQ(element: EngineerFoundation): BOQSection {
  const items: BOQItem[] = [];
  
  // Concrete - custom grade and volume
  items.push({
    code: 'FND-CON-ENG-001',
    description: `${element.concrete.grade} concrete as per engineer design Ref: ${element.id}`,
    unit: 'm³',
    quantity: element.concrete.volume,
    wastage: element.concrete.overbreakAllowance,
    totalQuantity: element.concrete.volume * 
                   (1 + element.concrete.overbreakAllowance / 100),
    unitRate: getConcreteRate(element.concrete.grade),
    totalCost: 0,
    designMode: 'engineer',
    engineerRef: element.engineerSignature.registrationNumber,
    customSpecification: true
  });
  
  // Reinforcement - custom specification
  element.reinforcement.bottomBars.forEach((layer, index) => {
    const massPerMeter = getRebarMassPerMeter(layer.size);
    const totalLength = layer.length * layer.quantity / 1000;
    const mass = totalLength * massPerMeter;
    
    items.push({
      code: `FND-RBR-ENG-${String(index + 1).padStart(3, '0')}`,
      description: `${layer.size} rebar @ ${layer.spacing}mm c/c (Engineer specified)`,
      unit: 'kg',
      quantity: mass,
      wastage: 7.5,
      totalQuantity: mass * 1.075,
      unitRate: getRebarRate(layer.size),
      totalCost: 0,
      designMode: 'engineer',
      engineerRef: element.engineerSignature.registrationNumber,
      customSpecification: true
    });
  });
  
  // Custom waterproofing if specified
  if (element.dampProofing.waterproofing) {
    items.push({
      code: 'FND-WTP-ENG-001',
      description: `${element.dampProofing.waterproofing.type} waterproofing (${element.dampProofing.waterproofing.coats} coats)`,
      unit: 'm²',
      quantity: element.dampProofing.waterproofing.area,
      wastage: 10,
      totalQuantity: element.dampProofing.waterproofing.area * 1.1,
      unitRate: getWaterproofingRate(element.dampProofing.waterproofing.type),
      totalCost: 0,
      designMode: 'engineer',
      engineerRef: element.engineerSignature.registrationNumber,
      customSpecification: true
    });
  }
  
  // Calculate totals
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0),
    designMode: 'engineer',
    engineerApproved: element.engineerSignature.approved
  };
}
```

---

# 12. Drawing Generation with Engineer Details

## 12.1 Title Block Enhancement for Engineer Mode

```ts
interface EnhancedTitleBlock {
  // Standard fields
  projectName: string;
  drawingNumber: string;
  scale: string;
  date: Date;
  revision: string;
  
  // Engineer mode additions
  designMode: 'standard' | 'engineer';
  
  engineerDetails?: {
    name: string;
    registration: string;
    company: string;
    signatureDate: Date;
    stampImage?: string;
  };
  
  designNotes?: string[];
  
  complianceStandards: string[]; // e.g., ['SANS 10400-H', 'SANS 10100-1']
}
```

## 12.2 Engineer Stamp Rendering

```tsx
function renderTitleBlock(config: EnhancedTitleBlock): SVGElement {
  const titleBlock = createTitleBlockSVG(config);
  
  if (config.designMode === 'engineer' && config.engineerDetails) {
    // Add engineer signature box
    const engineerBox = `
      <g id="engineer-signature">
        <rect x="550" y="180" width="200" height="80" 
              stroke="#000" fill="none" stroke-width="1"/>
        
        <text x="560" y="195" font-size="8" font-weight="bold">
          ENGINEER APPROVED:
        </text>
        
        <text x="560" y="210" font-size="7">
          ${config.engineerDetails.name}
        </text>
        
        <text x="560" y="220" font-size="7">
          Pr.Eng ECSA Reg: ${config.engineerDetails.registration}
        </text>
        
        <text x="560" y="230" font-size="7">
          ${config.engineerDetails.company}
        </text>
        
        <text x="560" y="245" font-size="6">
          Date: ${formatDate(config.engineerDetails.signatureDate)}
        </text>
        
        ${config.engineerDetails.stampImage ? `
          <image x="650" y="185" width="80" height="60" 
                 href="${config.engineerDetails.stampImage}"/>
        ` : ''}
      </g>
    `;
    
    titleBlock.appendChild(engineerBox);
  }
  
  return titleBlock;
}
```

## 12.3 Section View with Engineer Notes

```tsx
function renderFoundationSection(
  foundation: EngineerFoundation,
  sectionPlane: Plane
): SVGElement[] {
  const elements = renderStandardSection(foundation, sectionPlane);
  
  if (foundation.designMode === 'engineer') {
    // Add engineer design notes callout
    elements.push({
      type: 'text',
      position: { x: foundation.position.x + 500, y: foundation.position.y - 200 },
      content: [
        `Engineer Design: ${foundation.id}`,
        `Bearing Capacity: ${foundation.customSoilProperties.bearingCapacity} kPa`,
        `Foundation Width: ${foundation.width}mm`,
        `Pr.Eng: ${foundation.engineerSignature.name}`,
        `ECSA: ${foundation.engineerSignature.registrationNumber}`
      ],
      fontSize: 8,
      border: true
    });
    
    // Add detail reference bubble
    elements.push({
      type: 'circle',
      center: { x: foundation.position.x, y: foundation.position.y },
      radius: 20,
      stroke: '#000',
      strokeWidth: 2,
      fill: 'none'
    });
    
    elements.push({
      type: 'text',
      position: { x: foundation.position.x - 10, y: foundation.position.y + 5 },
      content: 'ENG',
      fontSize: 10,
      fontWeight: 'bold'
    });
  }
  
  return elements;
}
```

---

# 13. Data Model Summary

## 13.1 Complete Foundation System Schema

```ts
type Foundation = 
  | StandardStripFooting
  | EngineerStripFooting
  | StandardPadFooting
  | EngineerPadFooting
  | StandardRaft
  | EngineerRaft
  | StandardSlab
  | EngineerSlab;

interface FoundationSystem {
  foundations: Foundation[];
  soilReport?: GeotechnicalReport;
  designStandard: 'SANS' | 'EN' | 'US' | 'UK';
  
  // Validation
  complianceChecks: SANSComplianceCheck[];
  engineerApprovals: EngineerSignature[];
  
  // BOQ
  boq: FoundationBOQ;
  
  // Drawings
  planView: SVGElement[];
  sectionViews: SVGElement[];
  detailDrawings: SVGElement[];
}
```

---

# 14. Implementation Pseudocode

## 14.1 Foundation Creation Flow

```ts
function createFoundation(
  wall: Wall,
  soilClass: string,
  designMode: 'standard' | 'engineer'
): Foundation {
  if (designMode === 'standard') {
    // Automatic SANS-compliant design
    return createStandardFoundation(wall, soilClass);
  } else {
    // Open engineer modal
    const engineerParams = await openEngineerModal({
      elementType: 'foundation',
      elementId: wall.id,
      standardParams: createStandardFoundation(wall, soilClass)
    });
    
    // Validate engineer design
    const validation = validateFoundationCompliance(engineerParams);
    
    if (!validation.allPassed && !validation.hasApprovedOverrides) {
      throw new Error('Engineer design does not meet SANS requirements');
    }
    
    // Require signature
    if (!engineerParams.engineerSignature.approved) {
      throw new Error('Engineer signature required for custom design');
    }
    
    return engineerParams;
  }
}
```

## 14.2 BOQ Generation with Mode Detection

```ts
function generateProjectBOQ(project: Project): ProjectBOQ {
  const boq: ProjectBOQ = {
    standard: [],
    engineer: [],
    total: 0
  };
  
  // Process all foundations
  project.foundations.forEach(foundation => {
    const foundationBOQ = generateFoundationBOQ(foundation);
    
    if (foundation.designMode === 'standard') {
      boq.standard.push(...foundationBOQ.items);
    } else {
      // Add engineer reference to items
      foundationBOQ.items.forEach(item => {
        item.engineerRef = foundation.engineerSignature.registrationNumber;
        item.customSpecification = true;
      });
      boq.engineer.push(...foundationBOQ.items);
    }
  });
  
  // Calculate totals
  boq.total = [...boq.standard, ...boq.engineer]
    .reduce((sum, item) => sum + item.totalCost, 0);
  
  return boq;
}
```

---

# 15. SANS Engineering Drawing Requirements

## 15.1 Mandatory Drawing Elements

```ts
interface SANSEngineeringDrawing {
  // Title block
  titleBlock: {
    projectName: string;
    drawingNumber: string;
    drawingTitle: string;
    scale: string;
    date: Date;
    revision: string;
    drawnBy: string;
    checkedBy: string;
    approvedBy: string; // Engineer for engineered elements
  };
  
  // Views
  views: {
    plan: SVGElement[];
    sections: SVGElement[];
    details: SVGElement[];
    elevations?: SVGElement[];
  };
  
  // Dimensions
  dimensions: Dimension[];
  
  // Notes
  generalNotes: string[];
  specificNotes: {
    element: string;
    note: string;
  }[];
  
  // Materials schedule
  materialsSchedule: {
    item: string;
    specification: string;
    standard: string;
  }[];
  
  // For engineer-designed elements
  engineerDetails?: {
    elements: string[]; // List of engineer-designed element IDs
    signature: EngineerSignature;
    calculations: string; // Reference to calculation documents
  };
  
  // Compliance
  complianceStandards: string[]; // e.g., ['SANS 10400-H', 'SANS 10100-1']
}
```

## 15.2 Drawing Sheet Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  PROJECT NAME                                  DRG NO: FND-001   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                           │    │
│  │             FOUNDATION PLAN                               │    │
│  │             Scale 1:50                                    │    │
│  │                                                           │    │
│  │  [Foundation plan view with dimensions]                  │    │
│  │                                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  SECTION A-A          │  │  DETAIL 1             │           │
│  │  Scale 1:20           │  │  Scale 1:10           │           │
│  │                       │  │                       │           │
│  │  [Section view]       │  │  [Detail view]        │           │
│  │                       │  │                       │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                   │
│  GENERAL NOTES:                    MATERIALS SCHEDULE:          │
│  1. All dimensions in mm           Item    Specification        │
│  2. Foundation depth as shown      Concrete 20MPa SANS 2001     │
│  3. Rebar as per detail            Rebar    Y12 SANS 920        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ENGINEER APPROVAL (If applicable):                      │    │
│  │  Name: John Smith                                        │    │
│  │  Pr.Eng ECSA Reg: 123456                                │    │
│  │  Company: ABC Engineers                                  │    │
│  │  Date: 2026-02-18                    [STAMP]            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Title Block:                                            │    │
│  │  Project: Sample House          Scale: As Shown          │    │
│  │  Drawing: Foundation Plan       Date: 2026-02-18         │    │
│  │  Drawn: AB  Checked: CD         Rev: A                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

# 16. Testing & Validation

## 16.1 Standard Mode Tests

```ts
describe('Standard Foundation Creation', () => {
  it('should create SANS-compliant strip footing automatically', () => {
    const wall = createTestWall({ length: 10000, load: 50 });
    const foundation = createStandardFoundation(wall, 'H2');
    
    expect(foundation.designMode).toBe('standard');
    expect(foundation.foundingLevel).toBe(900); // H2 minimum
    expect(foundation.concrete.grade).toBe('20MPa');
    expect(foundation.reinforcement.bottomBars.cover).toBe(50);
  });
  
  it('should calculate correct BOQ for standard foundation', () => {
    const foundation = createTestStandardFoundation();
    const boq = generateFoundationBOQ(foundation);
    
    expect(boq.items).toContainItem('20MPa concrete');
    expect(boq.items).toContainItem('Y12 rebar');
    expect(boq.items).toContainItem('375 micron DPM');
  });
});
```

## 16.2 Engineer Mode Tests

```ts
describe('Engineer Foundation Design', () => {
  it('should allow custom foundation width', () => {
    const engineerFoundation = createEngineerFoundation({
      width: 800, // Custom width
      depth: 400  // Custom depth
    });
    
    expect(engineerFoundation.width).toBe(800);
    expect(engineerFoundation.designMode).toBe('engineer');
  });
  
  it('should require engineer signature for custom design', () => {
    const foundation = createEngineerFoundation();
    
    expect(() => {
      validateFoundation(foundation);
    }).toThrow('Engineer signature required');
  });
  
  it('should validate SANS compliance for engineer design', () => {
    const foundation = createEngineerFoundation({
      foundingLevel: 500, // Below minimum for H2
      soilClass: 'H2'
    });
    
    const validation = validateFoundationCompliance(foundation);
    const depthCheck = validation.find(c => c.rule === 'MINIMUM_FOUNDING_DEPTH');
    
    expect(depthCheck.compliant).toBe(false);
    expect(foundation.complianceOverride.hasOverrides).toBe(true);
  });
  
  it('should generate engineer-specific BOQ items', () => {
    const foundation = createEngineerFoundation();
    const boq = generateEngineerBOQ(foundation);
    
    boq.items.forEach(item => {
      expect(item.designMode).toBe('engineer');
      expect(item.engineerRef).toBeDefined();
    });
  });
});
```

---

# 17. User Workflow Examples

## 17.1 Standard Mode User Flow

```
1. User draws wall in plan view
2. System prompts: "Create foundation for this wall?"
3. User clicks "Yes - Standard SANS Design"
4. System displays dialog:
   - Soil Class: [Dropdown: H1/H2/H3/H4/S]
   - User selects "H2"
5. System auto-calculates:
   - Founding depth: 900mm ✓
   - Foundation width: 550mm ✓
   - Concrete: 20MPa ✓
   - Reinforcement: Y12 @ 200mm c/c ✓
6. Foundation created automatically
7. BOQ updated automatically
8. Section view shows foundation details
9. Ready for drawing export
```

## 17.2 Engineer Mode User Flow

```
1. User draws wall in plan view
2. System prompts: "Create foundation for this wall?"
3. User clicks "Engineer Design Mode"
4. Engineer Modal opens with 6 tabs
5. User inputs custom parameters:
   Tab 1: Geometry
   - Soil Class: Custom
   - Bearing Capacity: 120 kPa (from geotech report)
   - Foundation Width: 750mm
   - Founding Depth: 1100mm
   
   Tab 2: Materials
   - Concrete: 25MPa
   - Overbreak: 10%
   - Waterproofing: Torch-on membrane
   
   Tab 3: Reinforcement
   - Bottom: Y16 @ 150mm c/c
   - Top: Y12 @ 200mm c/c
   - Starters: Y16 @ 400mm c/c
   
   Tab 4: Loading
   - Dead Load: 45 kN/m
   - Live Load: 15 kN/m
   - Calculated bearing pressure: 80 kPa ✓
   
   Tab 5: Compliance
   - Reviews SANS checks
   - All pass ✓
   
   Tab 6: Signature
   - Enters engineer details
   - Signs digitally
   - Uploads stamp
   
6. Clicks "Save Engineer Design"
7. Foundation created with engineer specs
8. BOQ updated with custom items
9. Drawing shows "ENG" detail marker
10. Title block includes engineer approval box
11. Ready for drawing export
```

---

# 18. Summary of Dual-Mode Benefits

| Feature | Standard Mode | Engineer Mode |
|---------|---------------|---------------|
| **Speed** | Instant auto-creation | Detailed custom design |
| **Compliance** | Automatic SANS minimum | Validated with overrides |
| **Expertise Required** | None | Professional engineer |
| **BOQ Accuracy** | Standard rates | Custom specifications |
| **Drawing Detail** | Basic compliant | Detailed with notes |
| **Approval** | None required | Engineer signature mandatory |
| **Use Case** | Simple residential | Complex/commercial projects |
| **Cost** | Lower (standard materials) | Higher (custom specs) |

---

# 19. Integration with Existing Volumes

This Volume VII integrates with:

- **Volume I**: Geometry engine provides 3D foundation models
- **Volume II**: Dimensioning engine measures foundation elements
- **Volume III**: Rendering engine displays foundation in plan/section
- **Volume IV**: UI provides engineer modal interface
- **Volume V**: Marketplace templates include foundation designs
- **Volume VI**: Resellers can offer both standard and engineer services

---

# 20. Notes

- **Dual-mode system** allows both speed (standard) and precision (engineer)
- **SANS compliance** is enforced in both modes
- **Engineer signature** creates professional accountability
- **BOQ integration** handles both auto and custom specifications
- **Drawing generation** shows mode differentiation clearly
- **All calculations** are traceable and auditable

---

# 21. Completion

Volume VII establishes the complete **Dual-Mode Foundation Parameter System** with:

- Standard SANS auto-compliant mode for speed
- Engineer custom design mode for complex projects
- Comprehensive modal interface for all building elements
- Integrated BOQ generation for both modes
- SANS-compliant engineering drawing generation
- Professional engineer signature system
- Complete validation and compliance framework

This completes the foundation specification and extends the dual-mode engineering parameter concept to all building elements (walls, openings, slabs, roofs) for the enterprise-grade SVG-Based Parametric CAD & BOQ Platform.

---

**END OF VOLUME VII**
