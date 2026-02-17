roof materials must align with relevant SANS (South African National Standards) and National Building Regulations (NBR).

The primary governing standards are:

South African Bureau of Standards (SABS)

National Regulator for Compulsory Specifications (NRCS)

SANS 10400 – National Building Regulations

SANS 10160 – Structural loading

SANS 10243 – Thatch roofing

SANS 10237 – Nail-plated timber trusses

COMPLETE ROOF MATERIALS LIST (FOR BOQ STRUCTURE)

I will structure this exactly how you should build it into your BOQ engine:

1️⃣ Structural Roof Frame Materials
A. Timber Roof Structure (Most Common – Residential)

✔ Structural timber (SANS graded)

Rafters

Purlins

Wall plates

Ridge boards

Hip rafters

Valley rafters

Ceiling joists

Collar ties

Battens (38x38, 50x50, etc.)

✔ Prefabricated Trusses

Nail-plated trusses

Gang nail plates

Truss bracing timber

✔ Connectors & Fasteners

Galvanised nails

Coach screws

Bolts & washers

Joist hangers

Hurricane clips

Steel straps

✔ Bracing

Diagonal bracing

Longitudinal bracing

Permanent bracing systems

B. Light Steel Roof Structure

✔ Light gauge steel trusses
✔ Galvanised C-sections
✔ Top hats / battens
✔ Tek screws (self-drilling)
✔ Steel cleats
✔ Anchor bolts

2️⃣ Roof Covering Materials
A. Concrete Roof Tiles (SANS Approved)

Concrete roof tiles

Ridge tiles

Hip tiles

Verge tiles

Valley tiles

Tile clips

Tile nails

Underlayment:

Sisalation / reflective foil

Roof underlay membrane

B. Clay Roof Tiles

Clay tiles

Ridge/hip/verge tiles

Tile clips

Underlay membrane

C. Metal Roof Sheeting

✔ Corrugated sheeting
✔ IBR sheeting
✔ Concealed fix sheeting
✔ Chromadek
✔ Zincalume

Fixings:

Self-drilling roofing screws

Bonded washers

Stitching screws

Closures:

Foam closures

Ridge closures

D. Slate Roofing

Natural slate tiles

Copper nails

Underlay membrane

Slate hooks

E. Thatch Roofing (SANS 10243)

Thatch bundles

Thatch poles

Binding wire

Fire retardant treatment

Ridge capping

3️⃣ Waterproofing & Flashings

✔ Flashing (galvanised / aluminium / lead)

Apron flashing

Step flashing

Counter flashing

Valley flashing

Chimney flashing

✔ Waterproofing membranes
✔ Bituminous membranes
✔ Sealants (polyurethane / silicone)

4️⃣ Roof Drainage System

✔ Gutters (PVC / Aluminium / Galvanised)
✔ Downpipes
✔ Gutter brackets
✔ Gutter outlets
✔ Elbows
✔ Shoe outlets
✔ Rainwater heads
✔ Leaf guards

5️⃣ Insulation (SANS 10400-XA Compliance)

✔ Glass wool insulation
✔ Polyester insulation
✔ Polyurethane boards
✔ Reflective foil insulation
✔ Vapour barriers

6️⃣ Ventilation Components

✔ Ridge vents
✔ Roof vents
✔ Whirlybirds
✔ Eave vents
✔ Ventilation grilles

7️⃣ Ceilings (Roof-Related Materials)

✔ Ceiling brandering 
✔ Gypsum boards // areas controll in the room parameter settings
✔ PVC ceiling boards // areas controll in the room parameter settings
✔ Ceiling insulation // areas controll in the room parameter settings
✔ Cornices // controll in the room parameter settings
✔ Jointing compound // areas controll in the room parameter settings
✔ Ceiling screws // areas controll in the room parameter settings

8️⃣ Fire Protection (Where Required)

✔ Fire retardant timber treatment // Controlled per room parameter settings
✔ Fire-resistant ceiling boards // Controlled per room parameter settings
✔ Fire collars // Controlled per room parameter settings

9️⃣ Roof Safety & Access

✔ Walkways
✔ Anchor points
✔ Safety hooks
✔ Roof ladders

🔟 Roof Openings & Penetrations

✔ Skylights
✔ Roof windows
✔ Solar panel mounting brackets
✔ Satellite brackets
✔ Chimney cowls
✔ Pipe flashings

ADDITIONAL BOQ ITEMS MOST PEOPLE MISS

These are critical for your software logic:

✔ Underlay overlaps
✔ Wastage factor (5–12% depending on roof type)
✔ Extra tiles for cutting
✔ Valley reinforcement
✔ Storm clips (coastal regions per SANS wind load zones)
✔ Roof pitch compliance (minimum slope rules)
✔ Expansion joints (metal roofing)

FOR YOUR BOQ SOFTWARE STRUCTURE

You should structure it like:

SansRoof
 ├── Structure
 │     ├── Timber
 │     ├── Steel
 │
 ├── Covering
 │     ├── Tile
 │     ├── Metal
 │     ├── Slate
 │     ├── Thatch
 │
 ├── Waterproofing
 ├── Drainage
 ├── Insulation
 ├── Ventilation
 ├── Ceilings
 ├── Safety
 └── Openings

CRITICAL FOR YOUR CALCULATION ENGINE

For SANS compliance your roof module must consider:

Wind load (SANS 10160)

Roof pitch

Coastal corrosion zones

Fire zone (thatch especially)

Thermal resistance (SANS 10400-XA)

Structural deflection limits

Truss spacing

Batten spacing per tile type

Minimum overlaps (metal sheets)