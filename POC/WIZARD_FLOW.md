# Opportunity creation wizard flow

### What this page is

Developer notes on the **create opportunity** wizard steps and UX (may differ slightly from live `docs`—verify in UI).

### What happens next

Align with [docs/modules/opportunity-creation.md](../docs/modules/opportunity-creation.md).

---

## Overview

The opportunity creation form has been converted to a **4-step wizard flow** with improved UX, mandatory location selection, and a payment step.

## Wizard Steps

### Step 1: Model Selection
- **Purpose**: Select collaboration model and sub-model
- **Features**:
  - Searchable dropdown for all 13 collaboration models
  - Visual grouping by parent category
  - Keyboard navigation support
- **Validation**: Model and sub-model must be selected

### Step 2: Basic Information & Location
- **Purpose**: Enter basic details and select location
- **Fields**:
  - **Title** (required)
  - **Description** (optional)
  - **Location** (required, searchable)
  - **Status** (Draft/Published)
- **Location Features**:
  - Searchable dropdown with regions, cities, and districts
  - Supports Saudi Arabia regions and GCC countries
  - Stores full location path (Region > City > District)
- **Validation**: Title and location are mandatory

### Step 3: Model-Specific Details
- **Purpose**: Fill in model-specific attributes
- **Features**:
  - Dynamic fields based on selected model
  - Uses lookup data from JSON for dropdowns
  - Conditional field visibility
  - All field types supported (text, select, multi-select, currency, dates, etc.)

### Step 4: Payment & Financial Details
- **Purpose**: Configure payment terms
- **Fields**:
  - **Payment Method** (required)
    - Cash Payment
    - Bank Transfer
    - Check
    - Credit Card
    - Installments
    - Barter Exchange
    - Mixed (Cash + Barter)
  - **Currency** (required)
    - SAR (Saudi Riyal)
    - USD (US Dollar)
    - EUR (Euro)
    - AED (UAE Dirham)
    - KWD (Kuwaiti Dinar)
  - **Payment Terms Summary** (optional textarea)
  - **Payment Agreement** (required checkbox)
- **Validation**: Payment method, currency, and agreement checkbox required

## Data Files

### `/data/lookups.json`
Contains all lookup values for dropdown fields:
- Task types
- Experience levels
- Payment terms
- Employment types
- Job categories
- Consultation types
- Competition types
- Resource types
- Transaction types
- And many more...

**Usage**: Form service automatically uses lookups when rendering select fields.

### `/data/locations.json`
Hierarchical location data:
- **Regions**: Saudi Arabia regions (Riyadh, Makkah, Eastern Province, etc.)
- **Cities**: Cities within each region
- **Districts**: Districts within major cities
- **Special**: Remote, GCC countries

**Structure**:
```json
{
  "regions": [
    {
      "id": "riyadh",
      "name": "Riyadh",
      "cities": [
        {
          "id": "riyadh-city",
          "name": "Riyadh City",
          "districts": ["Al Olaya", "Al Malaz", ...]
        }
      ]
    }
  ]
}
```

## Wizard Navigation

### Progress Indicator
- Visual progress bar showing current step
- Completed steps shown in green
- Active step highlighted in blue
- Step numbers and labels

### Navigation Buttons
- **Previous**: Go back to previous step (hidden on step 1)
- **Next**: Validate current step and proceed (hidden on step 4)
- **Create Opportunity**: Submit form (only visible on step 4)
- **Cancel**: Exit wizard and return to opportunities list

### Step Validation
Each step validates before allowing progression:
- **Step 1**: Model selection required
- **Step 2**: Title and location required
- **Step 3**: Model-specific validations
- **Step 4**: Payment method, currency, and agreement required

## Location Search

### Features
- **Searchable**: Type to filter locations
- **Hierarchical**: Shows regions, cities, and districts
- **Grouped Display**: Locations grouped by type
- **Full Path**: Displays complete location path (Region > City > District)
- **Keyboard Navigation**: Arrow keys + Enter to select

### Location Storage
Stored in opportunity object:
```javascript
{
  location: "Riyadh > Riyadh City > Al Olaya",
  locationRegion: "Riyadh",
  locationCity: "Riyadh City",
  locationDistrict: "Al Olaya"
}
```

## Payment Step

### Purpose
- Capture payment preferences upfront
- Set expectations for collaboration
- Enable filtering by payment method
- Support various payment types including barter

### Payment Data Storage
```javascript
{
  paymentMethod: "bank_transfer",
  currency: "SAR",
  paymentTermsSummary: "50% upfront, 50% on completion"
}
```

## Form Service Updates

### Lookup Integration
Form service now supports lookup keys:
```javascript
{
  key: 'taskType',
  label: 'Task Type',
  type: 'select',
  lookupKey: 'taskTypes'  // Uses data/lookups.json
}
```

### Tailwind CSS Classes
All form fields now use Tailwind utility classes:
- `w-full px-4 py-2 border border-gray-300 rounded-md`
- `focus:outline-none focus:ring-2 focus:ring-primary`

## User Experience Improvements

### Before (Single Form)
- ❌ Long scrolling form
- ❌ Overwhelming number of fields
- ❌ No clear progress indication
- ❌ Location not mandatory
- ❌ No payment information

### After (Wizard Flow)
- ✅ Step-by-step progression
- ✅ Clear progress indicator
- ✅ Focused attention on each step
- ✅ Mandatory location selection
- ✅ Payment terms captured
- ✅ Better validation feedback
- ✅ Searchable location and model selection

## Technical Implementation

### Files Modified
1. `/pages/opportunity-create/index.html` - Wizard UI
2. `/features/opportunity-create/opportunity-create.js` - Wizard logic
3. `/src/services/opportunities/opportunity-form-service.js` - Lookup support
4. `/data/lookups.json` - Lookup data (new)
5. `/data/locations.json` - Location data (new)

### Key Functions
- `goToStep(step)` - Navigate between steps
- `validateCurrentStep()` - Validate step before proceeding
- `setupLocationSearch()` - Location search functionality
- `setupSearchableModelSelector()` - Model search functionality
- `renderDynamicFields()` - Load model-specific fields

## Future Enhancements

1. **Step Persistence**: Save draft at each step
2. **Step Skipping**: Allow skipping optional steps
3. **Progress Saving**: Auto-save progress
4. **Location Autocomplete**: Enhanced location suggestions
5. **Payment Calculator**: Calculate totals based on model
6. **Preview Step**: Review all information before submission
7. **Step Indicators**: Show completion percentage
8. **Mobile Optimization**: Better mobile wizard experience

## Testing Checklist

- [ ] Step 1: Model selection works
- [ ] Step 2: Location search works
- [ ] Step 3: Dynamic fields load correctly
- [ ] Step 4: Payment fields validate
- [ ] Navigation buttons work correctly
- [ ] Progress indicator updates
- [ ] Validation prevents invalid progression
- [ ] Form submission includes all data
- [ ] Location data stored correctly
- [ ] Payment data stored correctly
- [ ] Lookups load from JSON
- [ ] Mobile responsive

---

## Summary

The wizard flow transforms opportunity creation from a **single overwhelming form** into a **guided 4-step process** that:
- Improves user experience
- Ensures data completeness
- Makes location mandatory
- Captures payment preferences
- Uses centralized lookup data
- Provides clear progress feedback
