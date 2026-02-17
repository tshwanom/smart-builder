# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume V — Template Marketplace & Pricing Engine

**Generated:** 2026-02-17 UTC

---

# 1. Document Control

- Version: 5.0
- Author: Engineering Team
- Revision Date: 2026-02-17
- Approval: __________________

---

# 2. Scope

Volume V defines the **integrated template marketplace**, including:

- Designer template upload, management, and pricing
- Buyer purchase flow and template package generation
- Platform SQM-based markup pricing engine
- Commission calculation and payout logic
- Integration with CAD, BOQ, and compliance engines
- Security, licensing, and workflow

This enables designers to monetize designs and the platform to generate revenue while providing buyers a **ready-to-use parametric template package**.

---

# 3. Template Data Model

```ts
interface Template {
  id: string;
  designerId: string;
  title: string;
  description: string;
  categories: string[];
  thumbnail: string;
  geometryFile: string;
  basePrice: number; // Designer-defined
  sqM: number; // Calculated from CAD geometry
  platformMarkupPerSqM: number; // Platform fee per sqm
  finalPrice: number; // basePrice + (sqM * platformMarkupPerSqM)
  currency: string;
  countryStandard: 'SANS' | 'EN' | 'US' | 'UK';
  status: 'pending' | 'approved' | 'rejected';
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

- `basePrice`: Designer’s chosen base price for template
- `sqM`: Calculated from the total floor area in CAD
- `platformMarkupPerSqM`: Platform-controlled multiplier applied per sqm
- `finalPrice`: Displayed price for buyers

---

# 4. Marketplace Pricing Engine

## 4.1 Price Calculation Formula

```
Final Template Price = Base Price + (Total SQM * Platform SQM Rate)
```

### Example:
- Designer basePrice = $500
- Template area = 200 sqm
- Platform SQM markup = $10 per sqm
- Final Price = 500 + (200 * 10) = $2,500

## 4.2 Pseudocode

```ts
function calculateTemplatePrice(template: Template): number {
  const finalPrice = template.basePrice + (template.sqM * template.platformMarkupPerSqM);
  return roundToCurrencyPrecision(finalPrice, template.currency);
}
```

## 4.3 Buyer Package

- Buyer receives a **complete parametric package** including:
  - SVG/geometry project
  - BOQ ready for export
  - Title block and standard compliance preset
  - Material layers and settings
- Buyers can directly load template into platform and **generate plan, elevation, section, and BOQ**

---

# 5. Marketplace Workflow

### 5.1 Designer Upload Flow
1. Designer creates project in CAD platform
2. Save as template → attach metadata (title, description, categories, base price)
3. Platform calculates `sqM` and `finalPrice`
4. Admin approval (optional)
5. Template listed in marketplace

### 5.2 Buyer Purchase Flow
1. Browse templates → filter by type, category, country standard, price
2. Select template → view `finalPrice` (base + SQM markup)
3. Checkout via payment gateway
4. Platform calculates platform fee and designer commission
5. Template added to buyer account → download ready
6. Buyer can generate BOQ and drawing package directly

### 5.3 Commission Calculation

```
Platform Fee = Final Price * PlatformCommissionRate
Designer Commission = Final Price - Platform Fee
```

### 5.4 Transaction Pseudocode

```ts
function processTransaction(templateId: string, buyerId: string) {
  const template = getTemplate(templateId);
  const finalPrice = calculateTemplatePrice(template);
  const platformFee = finalPrice * PLATFORM_COMMISSION_RATE;
  const designerCommission = finalPrice - platformFee;

  const transaction: Transaction = {
    id: generateUUID(),
    templateId,
    buyerId,
    designerId: template.designerId,
    amount: finalPrice,
    platformFee,
    designerCommission,
    status: 'completed',
    createdAt: new Date(),
  };
  saveTransaction(transaction);
  notifyDesigner(template.designerId, transaction);
  deliverTemplateToBuyer(buyerId, template);
}
```

---

# 6. Marketplace Technical Architecture

- **Frontend**: Next.js web interface, CAD integration for template preview
- **Backend**: Node.js/Express or NestJS, database stores templates, transactions, user accounts
- **Database**: PostgreSQL / MongoDB for template metadata, geometry, and transactions
- **CAD Integration**: Geometry engine and BOQ engine read template directly
- **Payment Gateway**: PayPal / Stripe integration for secure payments
- **Commission Engine**: Automatic split between platform and designer

---

# 7. Security & Licensing

- Template download encrypted until purchase
- Buyer license enforced per account
- Admin can revoke or limit downloads if misuse detected
- Audit logs for all template transactions

---

# 8. Future Enhancements

- Optional 3D rendering for template previews
- Template rating and review system
- Subscription model for frequent buyers
- Bulk template bundles
- Multi-currency and multi-tax support per country

---

# 9. Notes

- All pricing is **dynamic**, based on designer base price + platform SQM markup
- BOQ and drawing generation works directly from purchased template without extra steps
- Marketplace fully integrated into the **existing CAD + BOQ platform**, providing end-to-end workflow for designers, buyers, and platform revenue generation

