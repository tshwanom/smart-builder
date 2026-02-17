# SVG-Based Parametric CAD & BOQ Engine  
# Volume VI — Reseller / Franchise SaaS Model  

**Version:** 6.0  
**Revision Date:** 2026-02-17  
**Document Type:** Enterprise Engineering Specification  

---

# 1. Scope

This document defines the **Reseller / Franchise SaaS Model** for the SVG-Based Parametric CAD & BOQ Platform.

This model enables third-party architects, designers, engineers, developers, and businesses to operate their own branded instance of the platform while purchasing square meter (SQM) capacity in bulk from the central system.

This model does NOT support subscriptions.  
All reseller participation is based strictly on prepaid SQM capacity purchases.

---

# 2. Strategic Objective

The objective of this model is to:

- Scale platform distribution without increasing internal design production
- Generate predictable cash flow through bulk SQM sales
- Empower industry professionals to operate under their own brand
- Maintain centralized technical and pricing control
- Expand into multi-country markets efficiently

---

# 3. Business Model Overview

Resellers purchase square meter (SQM) capacity upfront.

They receive:

- A fully branded website instance
- Access to the CAD engine
- BOQ generation capability
- Template marketplace access
- Ability to upload and sell their own templates
- Ability to set their own retail markup

Revenue is generated through:

- Bulk SQM sales to resellers
- Platform markup per SQM embedded in pricing
- Commission logic built into the pricing engine

No recurring subscriptions exist in this model.

---

# 4. Core Operational Principles

1. No subscription billing
2. Prepaid square meter capacity only
3. Minimum balance enforcement mandatory
4. Centralized control of pricing engine
5. Automated SQM deduction per sale
6. Full audit traceability
7. API-based architecture for all reseller instances

---

# 5. Reseller Data Model

```ts
interface Reseller {
  id: string;
  name: string;
  domain: string;
  packageType: 'Starter' | 'Professional' | 'Enterprise';
  sqmPurchased: number;
  sqmBalance: number;
  minBalanceRequired: number;
  pricingMarkup: number;
  websiteInstanceId: string;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
Field Definitions
sqmPurchased: Total SQM capacity purchased

sqmBalance: Remaining usable SQM

minBalanceRequired: Threshold required to maintain active selling

pricingMarkup: Reseller retail markup percentage

status: Operational state

6. Package Structure
Package	Initial Cost	Included SQM	Additional SQM Rate
Starter	R50,000	5,000 sqm	R12 per sqm
Professional	R100,000	12,000 sqm	R10 per sqm
Enterprise	R250,000	50,000 sqm	R8 per sqm

Package Rules
SQM must be prepaid

Higher packages reduce per-SQM cost

Additional SQM can be purchased anytime

No monthly or recurring fees

SQM does not expire (unless policy changes)

7. Website Provisioning Architecture
Upon package purchase:

Subdomain or custom domain is provisioned

Branding configuration activated

Marketplace enabled

CAD engine connected via API

BOQ engine connected

SQM balance initialized

Architecture Overview
Central Core System
Handles:

Authentication

SQM balance tracking

Pricing engine

Template licensing

BOQ generation

Audit logging

Reseller Instance
Branded frontend

Connected to central API

Uses shared CAD & BOQ engines

Maintains isolated reseller data

8. Pricing Engine Logic
8.1 Template Pricing Formula
Template SQM Used = Template Area (sqm)

Reseller Sale Price =
(Designer Base Price + (Platform SQM Markup × Template SQM))
× (1 + Reseller Markup)

8.2 SQM Deduction Logic
pgsql
Copy code
reseller.sqmBalance -= Template SQM
SQM is deducted immediately upon completed transaction.

9. Transaction Processing Pseudocode
ts
Copy code
function processResellerSale(templateId, resellerId, buyerId) {
  const template = getTemplate(templateId);
  const reseller = getReseller(resellerId);

  const sqmUsed = template.sqM;

  if (reseller.sqmBalance < sqmUsed) {
    throw new Error('Insufficient SQM balance');
  }

  const finalPrice =
    (template.basePrice + template.platformMarkupPerSqM * sqmUsed)
    * (1 + reseller.pricingMarkup);

  reseller.sqmBalance -= sqmUsed;

  saveTransaction({
    templateId,
    buyerId,
    resellerId,
    amount: finalPrice,
    sqmUsed,
    createdAt: new Date(),
  });

  deliverTemplateToBuyer(buyerId, template);
}
10. Minimum Balance Enforcement
If:

nginx
Copy code
sqmBalance < minBalanceRequired
Then:

Reseller status = suspended

Template sales disabled

Dashboard warning displayed

Email notification triggered

Reactivation requires manual SQM top-up.

11. Financial Control & Cash Flow Model
This model ensures:

Immediate revenue from bulk SQM sales

Predictable cash flow

No reliance on subscriptions

Scalable growth without internal production increase

Capacity monetization without labor expansion

Bulk SQM pre-purchase shifts working capital to the platform.

12. Security & Compliance
Encrypted API communication (TLS)

Transaction audit logs

Fraud detection validation

Template license enforcement

Single-buyer download control (configurable)

Central compliance enforcement for multi-country standards

13. Marketplace Integration
Resellers can:

Upload proprietary templates

Sell central marketplace templates

Set markup percentage

Bundle templates into packages

All pricing calculations remain controlled by the central pricing engine.

14. Strategic Expansion Model
This structure enables:

Architects to operate branded micro-marketplaces

Engineers to monetize plan libraries

Developers to distribute housing packages

International expansion without infrastructure duplication

The platform remains central authority over:

SQM tracking

Pricing calculation

License enforcement

Compliance control

Data integrity

15. Conclusion
Volume VI defines the complete Reseller / Franchise SaaS Model based entirely on prepaid square meter capacity.

It enables:

Scalable growth

Predictable revenue

Controlled marketplace expansion

Multi-country deployment

No subscription dependency

This completes the enterprise-grade reseller architecture for the SVG-Based Parametric CAD & BOQ Platform.

yaml
Copy code

---

If you’d like, I can now:

- Add legal structure (Terms framework for resellers)
- Add detailed API contract specification
- Add financial reporting schema
- Or create a board-level strategic summary version of Volume VI