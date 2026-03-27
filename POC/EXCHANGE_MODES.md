# Exchange modes implementation

### What this page is

Field-level reference for **exchange modes** (cash, barter, equity, and so on) in the opportunity flow.

### What happens next

See config and opportunity models in code for the source of truth.

---

## Overview

PMTwin supports **5 exchange modes** beyond traditional cash payments, enabling flexible value exchange in construction collaborations.

## Exchange Modes

### 1. 💵 Cash
**Description**: Standard payments with defined terms and milestones

**Fields**:
- **Cash Amount** (required) - Total cash amount
- **Payment Terms** (required) - Upfront, Milestone-Based, Upon Completion, Monthly, Installments
- **Currency** (required) - SAR, USD, EUR, AED, KWD
- **Payment Milestones** (optional) - Description of payment schedule

**Example**: "Structural engineer, 10K SAR in 2 milestones"

**Data Structure**:
```javascript
{
  exchangeMode: 'cash',
  cashAmount: 10000,
  cashPaymentTerms: 'milestone_based',
  currency: 'SAR',
  cashMilestones: '50% upfront (5K SAR), 50% on completion (5K SAR)'
}
```

### 2. 📊 Equity
**Description**: Ownership stake for contribution; includes vesting

**Fields**:
- **Equity Percentage** (required) - Percentage of ownership stake (0-100%)
- **Vesting Period** (optional) - Immediate, 1 Year, 2 Years, 3 Years, 4 Years, Custom
- **Contribution Description** (optional) - What contribution earns this equity

**Example**: "Join our JV: 40% equity for expertise + equipment"

**Data Structure**:
```javascript
{
  exchangeMode: 'equity',
  equityPercentage: 40,
  equityVesting: '2_years',
  equityContribution: 'Join our JV: 40% equity for expertise + equipment'
}
```

### 3. % Profit-Sharing
**Description**: Share revenue or profit without ownership transfer

**Fields**:
- **Profit Split Percentage** (required) - e.g., "60-40" or "50-30-20"
- **Profit Basis** (optional) - Revenue Share, Profit Share (After Costs), Gross Profit Share
- **Distribution Schedule** (optional) - How and when profits will be distributed

**Example**: "Consortium: 60-40 profit split after costs"

**Data Structure**:
```javascript
{
  exchangeMode: 'profit_sharing',
  profitSplit: '60-40',
  profitBasis: 'profit',
  profitDistribution: 'Consortium: 60-40 profit split after costs, distributed quarterly'
}
```

### 4. ⇄ Barter
**Description**: Direct exchange of resources or services; no cash

**Fields**:
- **What You Offer** (required) - Description of what you're offering
- **What You Need** (required) - Description of what you need in return
- **Estimated Value** (optional) - Equivalent value estimation

**Example**: "Offer office space; need structural engineering"

**Data Structure**:
```javascript
{
  exchangeMode: 'barter',
  barterOffer: 'Office space in Riyadh, 200 sqm',
  barterNeed: 'Structural engineering services for 3-month project',
  barterValue: 'Equivalent to 50K SAR'
}
```

### 5. 🔗 Hybrid
**Description**: Mix cash, equity, or barter and in-kind for flexible deals

**Fields**:
- **Cash Percentage** (optional) - % of cash component
- **Equity Percentage** (optional) - % of equity component
- **Barter Percentage** (optional) - % of barter component
- **Currency** (required) - For cash component
- **Cash Details** (optional) - Details about cash component
- **Equity Details** (optional) - Details about equity component
- **Barter Details** (optional) - Details about barter component

**Validation**: Percentages must sum to 100%

**Example**: "SPV: 30% cash, 50% equity, 20% Bartering"

**Data Structure**:
```javascript
{
  exchangeMode: 'hybrid',
  currency: 'SAR',
  hybridCash: 30,
  hybridEquity: 50,
  hybridBarter: 20,
  hybridCashDetails: '30% cash upfront',
  hybridEquityDetails: '50% equity stake',
  hybridBarterDetails: '20% in-kind services'
}
```

## UI Implementation

### Visual Card Selection
- 5 cards displayed in a responsive grid
- Each card shows:
  - Icon representing the mode
  - Title
  - Brief description
- Cards are clickable and show selected state
- Selected mode displayed with "Change" option

### Dynamic Fields
- Fields appear based on selected exchange mode
- Mode-specific validation
- Real-time feedback (e.g., hybrid total percentage)

### Currency Field
- Only shown for Cash and Hybrid modes
- Hidden for Equity, Profit-Sharing, and Barter modes

## Validation Rules

### All Modes
- Exchange mode selection required
- Exchange agreement checkbox required

### Cash Mode
- Cash amount required
- Payment terms required
- Currency required

### Equity Mode
- Equity percentage required (0-100%)

### Profit-Sharing Mode
- Profit split percentage required

### Barter Mode
- Barter offer required
- Barter need required

### Hybrid Mode
- Currency required
- Percentages must sum to 100%
- At least one component must be specified

## Data Storage

All exchange mode data is stored in the opportunity object:

```javascript
{
  exchangeMode: 'cash' | 'equity' | 'profit_sharing' | 'barter' | 'hybrid',
  exchangeData: {
    // Mode-specific fields
  },
  exchangeTermsSummary: 'Additional terms and notes',
  currency: 'SAR' // Only for cash/hybrid
}
```

## Benefits

1. **Flexibility**: Supports various value exchange methods
2. **Non-Monetary**: Enables collaborations where cash is scarce
3. **Transparency**: Clear terms for each exchange mode
4. **Hybrid Options**: Mix multiple exchange types
5. **Better Matching**: Allows matching based on exchange preferences

## Use Cases

- **Cash**: Traditional paid projects
- **Equity**: Joint ventures, startups, long-term partnerships
- **Profit-Sharing**: Consortia, revenue-sharing agreements
- **Barter**: Resource exchange, service swaps
- **Hybrid**: Complex deals combining multiple exchange types

## Future Enhancements

1. **Exchange Mode Filtering**: Filter opportunities by exchange mode
2. **Exchange Calculator**: Calculate equivalent values
3. **Exchange Templates**: Pre-defined exchange structures
4. **Exchange Negotiation**: Built-in negotiation tools
5. **Exchange History**: Track exchange mode preferences
