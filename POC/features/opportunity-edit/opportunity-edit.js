/**
 * Opportunity Edit Component
 * Note: Function names are prefixed with 'edit' to avoid conflicts with opportunity-detail.js
 */

let editingOpportunity = null;

// Initialize shared data object if it doesn't exist
if (!window.opportunityFormData) {
    window.opportunityFormData = {
        lookupsData: null,
        locationsData: null
    };
}

// Helper functions to get/set shared data
function editGetLookupsData() {
    return window.opportunityFormData.lookupsData;
}

function editSetLookupsData(data) {
    window.opportunityFormData.lookupsData = data;
}

function editGetLocationsData() {
    return window.opportunityFormData.locationsData;
}

function editSetLocationsData(data) {
    window.opportunityFormData.locationsData = data;
}

async function initOpportunityEdit(params) {
    const opportunityId = params?.id;
    
    if (!opportunityId) {
        editShowError('No opportunity ID provided');
        return;
    }
    
    // Load data files
    await editLoadDataFiles();
    
    // Load opportunity models script if not loaded
    if (!window.OPPORTUNITY_MODELS) {
        await editLoadScript('src/business-logic/models/opportunity-models.js');
    }
    
    // Load form service if not loaded
    if (!window.opportunityFormService) {
        await editLoadScript('src/services/opportunities/opportunity-form-service.js');
    }
    
    // Load rich text editor utility
    await editLoadScript('src/utils/rich-text-editor.js');
    
    await editLoadOpportunity(opportunityId);
}

async function editLoadDataFiles() {
    try {
        // Use shared data if already loaded - no need to fetch again
        if (editGetLookupsData() && editGetLocationsData()) {
            return;
        }
        
        const [lookupsRes, locationsRes] = await Promise.all([
            fetch('data/lookups.json'),
            fetch('data/locations.json')
        ]);
        
        const loadedLookups = await lookupsRes.json();
        const loadedLocations = await locationsRes.json();
        
        // Store in shared data object
        editSetLookupsData(loadedLookups);
        editSetLocationsData(loadedLocations);
    } catch (error) {
        console.error('Error loading data files:', error);
    }
}

async function editLoadOpportunity(opportunityId) {
    const loadingDiv = document.getElementById('edit-loading');
    const formDiv = document.getElementById('opportunity-edit-form');
    const errorDiv = document.getElementById('edit-error');
    
    try {
        // Load opportunity
        const opportunity = await dataService.getOpportunityById(opportunityId);
        
        if (!opportunity) {
            throw new Error('Opportunity not found');
        }
        
        // Check if current user is the owner
        const currentUser = authService.getCurrentUser();
        if (!currentUser || opportunity.creatorId !== currentUser.id) {
            // Allow admins to edit as well
            if (!authService.isAdmin()) {
                throw new Error('You do not have permission to edit this opportunity');
            }
        }
        
        editingOpportunity = opportunity;
        
        // Hide loading, show form
        loadingDiv.classList.add('hidden');
        formDiv.style.display = 'block';
        
        // Populate form
        await editPopulateForm(opportunity);
        
        // Setup form handlers
        editSetupFormHandlers();
        
    } catch (error) {
        console.error('Error loading opportunity:', error);
        loadingDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        const p = errorDiv.querySelector('p');
        if (p) p.textContent = error.message || 'Failed to load opportunity';
    }
}

async function editPopulateForm(opportunity) {
    const formService = window.opportunityFormService;
    
    // Update form service to use lookups
    const lookups = editGetLookupsData();
    if (lookups && formService) {
        formService.setLookups(lookups);
    }
    
    // Set hidden ID
    document.getElementById('opportunity-id').value = opportunity.id;
    
    // Set model type (read-only display)
    const modelName = editGetModelName(opportunity.modelType);
    const subModelName = editGetSubModelName(opportunity.modelType, opportunity.subModelType);
    
    document.getElementById('model-type-display').value = modelName;
    document.getElementById('model-type').value = opportunity.modelType;
    document.getElementById('submodel-type-display').value = subModelName;
    document.getElementById('submodel-type').value = opportunity.subModelType;
    
    // Set basic fields
    document.getElementById('title').value = opportunity.title || '';
    document.getElementById('description').value = opportunity.description || '';
    document.getElementById('status').value = opportunity.status || 'draft';
    
    // Populate location fields
    editPopulateLocation(opportunity);
    editInitMapPicker(opportunity);
    const att = opportunity.attributes || {};
    const locReqEl = document.getElementById('location-requirement');
    if (locReqEl && att.locationRequirement) locReqEl.value = att.locationRequirement;
    const startEl = document.getElementById('attr-startDate');
    if (startEl && att.startDate) startEl.value = att.startDate;
    const deadlineEl = document.getElementById('attr-applicationDeadline');
    if (deadlineEl && att.applicationDeadline) deadlineEl.value = att.applicationDeadline;
    const endEl = document.getElementById('attr-endDate');
    if (endEl && att.endDate) endEl.value = att.endDate;
    
    // Render and populate dynamic fields
    editRenderDynamicFields(opportunity);
    
    // Populate exchange mode fields
    editPopulateExchangeMode(opportunity);
    
    // Initialize rich text editors after form is populated
    setTimeout(() => {
        if (window.RichTextEditor) {
            window.RichTextEditor.initAll();
            
            // Set content for rich text editors if they have values
            const descriptionField = document.getElementById('description');
            if (descriptionField && descriptionField.value) {
                window.RichTextEditor.setContent('description', descriptionField.value);
            }
        }
    }, 300);
}

function editGetModelName(modelKey) {
    const models = window.OPPORTUNITY_MODELS;
    if (models && models[modelKey]) {
        return models[modelKey].name;
    }
    return modelKey;
}

function editGetSubModelName(modelKey, subModelKey) {
    const models = window.OPPORTUNITY_MODELS;
    if (models && models[modelKey] && models[modelKey].subModels && models[modelKey].subModels[subModelKey]) {
        return models[modelKey].subModels[subModelKey].name;
    }
    return subModelKey;
}

function editPopulateLocation(opportunity) {
    // Setup location search first
    editSetupLocationSearch();
    
    // Populate location fields if they exist
    if (opportunity.locationCountry || opportunity.locationRegion || opportunity.locationCity) {
        setTimeout(() => {
            editSetLocationValue('country', opportunity.locationCountry);
            setTimeout(() => {
                editSetLocationValue('region', opportunity.locationRegion);
                setTimeout(() => {
                    editSetLocationValue('city', opportunity.locationCity);
                    setTimeout(() => {
                        if (opportunity.locationDistrict) {
                            editSetLocationValue('district', opportunity.locationDistrict);
                        }
                        // Update location string
                        const locationInput = document.getElementById('location');
                        if (locationInput && opportunity.location) {
                            locationInput.value = opportunity.location;
                        }
                    }, 100);
                }, 100);
            }, 100);
        }, 200);
    }
}

function editSetLocationValue(level, value) {
    const searchInput = document.getElementById(`location-${level}-search`);
    const hiddenInput = document.getElementById(`location-${level}`);
    const display = document.getElementById(`location-${level}-display`);
    
    if (!searchInput || !hiddenInput) return;
    
    // Find the location data
    const locations = editGetLocationsData();
    if (level === 'country' && locations) {
        const country = locations.countries.find(c => c.id === value);
        if (country) {
            hiddenInput.value = country.id;
            searchInput.value = '';
            searchInput.disabled = true;
            if (display) {
                display.querySelector(`#location-${level}-name`).textContent = country.name;
                display.classList.remove('hidden');
            }
            // Enable region search
            const regionSearch = document.getElementById('location-region-search');
            if (regionSearch) {
                regionSearch.disabled = false;
                regionSearch.classList.remove('bg-gray-50');
                regionSearch.placeholder = 'Search region...';
            }
        }
    } else if (level === 'region') {
        const locations = editGetLocationsData();
        if (!locations) return;
        const countryId = document.getElementById('location-country').value;
        const country = locations.countries.find(c => c.id === countryId);
        if (country) {
            const region = country.regions.find(r => r.id === value);
            if (region) {
                hiddenInput.value = region.id;
                searchInput.value = '';
                searchInput.disabled = true;
                if (display) {
                    display.querySelector(`#location-${level}-name`).textContent = region.name;
                    display.classList.remove('hidden');
                }
                // Enable city search
                const citySearch = document.getElementById('location-city-search');
                if (citySearch) {
                    citySearch.disabled = false;
                    citySearch.classList.remove('bg-gray-50');
                    citySearch.placeholder = 'Search city...';
                }
            }
        }
    } else if (level === 'city') {
        const locations = editGetLocationsData();
        if (!locations) return;
        const countryId = document.getElementById('location-country').value;
        const regionId = document.getElementById('location-region').value;
        const country = locations.countries.find(c => c.id === countryId);
        if (country) {
            const region = country.regions.find(r => r.id === regionId);
            if (region) {
                const city = region.cities.find(c => c.id === value);
                if (city) {
                    hiddenInput.value = city.id;
                    searchInput.value = '';
                    searchInput.disabled = true;
                    if (display) {
                        display.querySelector(`#location-${level}-name`).textContent = city.name;
                        display.classList.remove('hidden');
                    }
                    // Enable district search
                    const districtSearch = document.getElementById('location-district-search');
                    if (districtSearch) {
                        districtSearch.disabled = false;
                        districtSearch.classList.remove('bg-gray-50');
                        districtSearch.placeholder = 'Search district (optional)...';
                    }
                }
            }
        }
    } else if (level === 'district') {
        hiddenInput.value = value;
        searchInput.value = value;
        searchInput.disabled = true;
        if (display) {
            display.querySelector(`#location-${level}-name`).textContent = value;
            display.classList.remove('hidden');
        }
    }
}

function editSetupLocationSearch() {
    // Reuse the location search setup from create form
    // We'll create a simplified version here
    const countrySearch = document.getElementById('location-country-search');
    const countryInput = document.getElementById('location-country');
    const countryDropdown = document.getElementById('location-country-dropdown');
    const countryDisplay = document.getElementById('location-country-display');
    
    const locations = editGetLocationsData();
    if (!countrySearch || !locations) return;
    
    const countries = locations.countries.map(c => ({ id: c.id, name: c.name }));
    
    // Setup country dropdown
    editSetupSearchableDropdown(
        countrySearch,
        countryInput,
        countryDropdown,
        countryDisplay,
        countries,
        (selectedCountry) => {
            countryInput.value = selectedCountry.id;
            countrySearch.value = '';
            countrySearch.disabled = true;
            if (countryDisplay) {
                countryDisplay.querySelector('#location-country-name').textContent = selectedCountry.name;
                countryDisplay.classList.remove('hidden');
            }
            countryDropdown.classList.add('hidden');
            
            // Enable region search
            const regionSearch = document.getElementById('location-region-search');
            if (regionSearch) {
                regionSearch.disabled = false;
                regionSearch.classList.remove('bg-gray-50');
                regionSearch.placeholder = 'Search region...';
                
                // Setup region dropdown
                const locations = editGetLocationsData();
                if (!locations) return;
                const countryData = locations.countries.find(c => c.id === selectedCountry.id);
                if (!countryData) return;
                if (countryData && countryData.regions) {
                    const regions = countryData.regions.map(r => ({ id: r.id, name: r.name }));
                    const regionInput = document.getElementById('location-region');
                    const regionDropdown = document.getElementById('location-region-dropdown');
                    const regionDisplay = document.getElementById('location-region-display');
                    
                    editSetupSearchableDropdown(
                        regionSearch,
                        regionInput,
                        regionDropdown,
                        regionDisplay,
                        regions,
                        (region) => {
                            regionInput.value = region.id;
                            regionSearch.value = '';
                            regionSearch.disabled = true;
                            if (regionDisplay) {
                                regionDisplay.querySelector('#location-region-name').textContent = region.name;
                                regionDisplay.classList.remove('hidden');
                            }
                            regionDropdown.classList.add('hidden');
                            
                            // Enable city search
                            const citySearch = document.getElementById('location-city-search');
                            if (citySearch) {
                                citySearch.disabled = false;
                                citySearch.classList.remove('bg-gray-50');
                                citySearch.placeholder = 'Search city...';
                                
                                // Setup city dropdown
                                const selectedRegion = countryData.regions.find(r => r.id === region.id);
                                if (selectedRegion && selectedRegion.cities) {
                                    const cities = selectedRegion.cities.map(c => ({ id: c.id, name: c.name }));
                                    const cityInput = document.getElementById('location-city');
                                    const cityDropdown = document.getElementById('location-city-dropdown');
                                    const cityDisplay = document.getElementById('location-city-display');
                                    
                                    editSetupSearchableDropdown(
                                        citySearch,
                                        cityInput,
                                        cityDropdown,
                                        cityDisplay,
                                        cities,
                                        (city) => {
                                            cityInput.value = city.id;
                                            citySearch.value = '';
                                            citySearch.disabled = true;
                                            if (cityDisplay) {
                                                cityDisplay.querySelector('#location-city-name').textContent = city.name;
                                                cityDisplay.classList.remove('hidden');
                                            }
                                            cityDropdown.classList.add('hidden');
                                            
                                            // Enable district search
                                            const districtSearch = document.getElementById('location-district-search');
                                            if (districtSearch) {
                                                districtSearch.disabled = false;
                                                districtSearch.classList.remove('bg-gray-50');
                                                districtSearch.placeholder = 'Search district (optional)...';
                                                
                                                // Setup district dropdown
                                                const selectedCity = selectedRegion.cities.find(c => c.id === city.id);
                                                if (selectedCity && selectedCity.districts) {
                                                    const districts = selectedCity.districts.map(d => ({ name: d }));
                                                    const districtInput = document.getElementById('location-district');
                                                    const districtDropdown = document.getElementById('location-district-dropdown');
                                                    const districtDisplay = document.getElementById('location-district-display');
                                                    
                                                    editSetupSearchableDropdown(
                                                        districtSearch,
                                                        districtInput,
                                                        districtDropdown,
                                                        districtDisplay,
                                                        districts,
                                                        (district) => {
                                                            districtInput.value = district.name;
                                                            districtSearch.value = '';
                                                            districtSearch.disabled = true;
                                                            if (districtDisplay) {
                                                                districtDisplay.querySelector('#location-district-name').textContent = district.name;
                                                                districtDisplay.classList.remove('hidden');
                                                            }
                                                            districtDropdown.classList.add('hidden');
                                                            editUpdateLocationString();
                                                        }
                                                    );
                                                }
                                            }
                                            editUpdateLocationString();
                                        }
                                    );
                                }
                            }
                        }
                    );
                }
            }
            editUpdateLocationString();
        }
    );
}

function editSetupSearchableDropdown(searchInput, hiddenInput, dropdown, display, items, onSelect) {
    if (!searchInput || !dropdown) return;
    
    searchInput.dataset.items = JSON.stringify(items);
    
    if (searchInput.dataset.initialized === 'true') {
        searchInput.dataset.items = JSON.stringify(items);
        return;
    }
    
    searchInput.dataset.initialized = 'true';
    
    function renderDropdown(searchTerm = '') {
        const currentItems = JSON.parse(searchInput.dataset.items || '[]');
        const term = searchTerm.toLowerCase();
        const filteredItems = term ? 
            currentItems.filter(item => item.name.toLowerCase().includes(term)) : 
            currentItems;
        
        if (filteredItems.length === 0) {
            dropdown.querySelector('.searchable-dropdown-content').innerHTML = 
                '<div class="p-4 text-center text-gray-500">No results found</div>';
            dropdown.classList.remove('hidden');
            return;
        }
        
        const html = filteredItems.map((item, idx) => `
            <div class="searchable-dropdown-item" data-index="${idx}">
                ${item.name}
            </div>
        `).join('');
        
        dropdown.querySelector('.searchable-dropdown-content').innerHTML = html;
        dropdown.classList.remove('hidden');
        
        dropdown.querySelectorAll('.searchable-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const selectedItem = filteredItems[parseInt(item.dataset.index)];
                onSelect(selectedItem);
            });
        });
    }
    
    searchInput.addEventListener('focus', () => {
        if (!searchInput.disabled) {
            renderDropdown(searchInput.value);
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        if (!searchInput.disabled) {
            renderDropdown(e.target.value);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function editUpdateLocationString() {
    const locationInput = document.getElementById('location');
    if (!locationInput) return;
    
    const parts = [];
    const countryName = document.querySelector('#location-country-name')?.textContent;
    const regionName = document.querySelector('#location-region-name')?.textContent;
    const cityName = document.querySelector('#location-city-name')?.textContent;
    const districtName = document.querySelector('#location-district-name')?.textContent;
    
    if (countryName) parts.push(countryName);
    if (regionName) parts.push(regionName);
    if (cityName) parts.push(cityName);
    if (districtName) parts.push(districtName);
    
    locationInput.value = parts.join(' > ');
}

window.editClearLocationSelection = function(level) {
    if (level === 'country') {
        document.getElementById('location-country').value = '';
        document.getElementById('location-country-search').value = '';
        document.getElementById('location-country-search').disabled = false;
        document.getElementById('location-country-display').classList.add('hidden');
        editClearLocationSelection('region');
    } else if (level === 'region') {
        document.getElementById('location-region').value = '';
        document.getElementById('location-region-search').value = '';
        document.getElementById('location-region-search').disabled = true;
        document.getElementById('location-region-search').classList.add('bg-gray-50');
        document.getElementById('location-region-display').classList.add('hidden');
        editClearLocationSelection('city');
    } else if (level === 'city') {
        document.getElementById('location-city').value = '';
        document.getElementById('location-city-search').value = '';
        document.getElementById('location-city-search').disabled = true;
        document.getElementById('location-city-search').classList.add('bg-gray-50');
        document.getElementById('location-city-display').classList.add('hidden');
        editClearLocationSelection('district');
    } else if (level === 'district') {
        document.getElementById('location-district').value = '';
        document.getElementById('location-district-search').value = '';
        document.getElementById('location-district-search').disabled = true;
        document.getElementById('location-district-search').classList.add('bg-gray-50');
        document.getElementById('location-district-display').classList.add('hidden');
    }
    editUpdateLocationString();
};

function editRenderDynamicFields(opportunity) {
    const formService = window.opportunityFormService;
    const container = document.getElementById('dynamic-fields');
    
    if (!container || !formService) return;
    
    const attributes = formService.getAttributes(opportunity.modelType, opportunity.subModelType);
    
    if (attributes.length === 0) {
        container.innerHTML = '<p class="text-gray-500 italic">No additional fields for this model.</p>';
        return;
    }
    
    // Populate field values from opportunity.attributes or opportunity.modelData
    const data = opportunity.attributes || opportunity.modelData || {};
    
    // Render fields with their values
    container.innerHTML = attributes.map(attr => {
        const value = data[attr.key];
        return formService.renderField(attr, value);
    }).join('');
    
    // Populate field values (for fields that need special handling after render)
    attributes.forEach(attr => {
        const field = document.getElementById(attr.key);
        if (!field) return;
        
        const value = data[attr.key];
        if (value === undefined || value === null) return;
        
        switch (attr.type) {
            case 'text':
            case 'number':
            case 'date':
            case 'select':
                field.value = value;
                break;
            case 'textarea':
                field.value = value;
                // If it's a rich text editor, set content after a delay
                if (field.hasAttribute('data-rich-text')) {
                    setTimeout(() => {
                        if (window.RichTextEditor) {
                            window.RichTextEditor.setContent(attr.key, value || '');
                        }
                    }, 100);
                }
                break;
            case 'boolean':
                field.checked = !!value;
                break;
            case 'tags':
            case 'multi-select':
                if (Array.isArray(value)) {
                    field.value = value.join(', ');
                } else {
                    field.value = value;
                }
                break;
            case 'currency':
                field.value = value;
                break;
            case 'currency-range':
                // Handle currency-range fields - value can be an object with min/max or a string
                // Note: Fields are already populated during renderField, but we ensure they're set here too
                const minField = document.getElementById(`${attr.key}_min`);
                const maxField = document.getElementById(`${attr.key}_max`);
                
                if (minField && maxField && value) {
                    if (typeof value === 'object' && value !== null) {
                        // Object format: { min: 50000, max: 75000 }
                        if (value.min !== undefined && value.min !== null && value.min !== '') {
                            minField.value = value.min;
                        }
                        if (value.max !== undefined && value.max !== null && value.max !== '') {
                            maxField.value = value.max;
                        }
                    } else if (typeof value === 'string') {
                        // String format: "50000-75000" or "50000 to 75000"
                        const parts = value.split(/[-to]/).map(p => p.trim()).filter(p => p);
                        if (parts.length >= 2) {
                            minField.value = parts[0];
                            maxField.value = parts[1];
                        } else if (parts.length === 1) {
                            // Single value, use for both min and max
                            minField.value = parts[0];
                            maxField.value = parts[0];
                        }
                    } else if (typeof value === 'number') {
                        // Single number, use for both
                        minField.value = value;
                        maxField.value = value;
                    }
                }
                break;
            case 'date-range':
                const startField = document.getElementById(`${attr.key}_start`);
                const endField = document.getElementById(`${attr.key}_end`);
                if (startField && value.start) startField.value = value.start;
                if (endField && value.end) endField.value = value.end;
                break;
            default:
                if (typeof value === 'object') {
                    field.value = JSON.stringify(value);
                } else {
                    field.value = value;
                }
        }
    });
    
    // Setup conditional fields
    const form = document.getElementById('opportunity-edit-form');
    formService.setupConditionalFields(form);
}

function editPopulateExchangeMode(opportunity) {
    const exchangeMode = opportunity.exchangeMode || opportunity.exchangeData?.exchangeMode;
    const exchangeData = opportunity.exchangeData || {};
    
    // Populate budget range fields (now in exchange section)
    const budgetRange = exchangeData.budgetRange || opportunity.attributes?.budgetRange;
    if (budgetRange) {
        const budgetMinField = document.getElementById('budgetRange_min');
        const budgetMaxField = document.getElementById('budgetRange_max');
        if (budgetMinField && budgetRange.min !== undefined) {
            budgetMinField.value = budgetRange.min;
        }
        if (budgetMaxField && budgetRange.max !== undefined) {
            budgetMaxField.value = budgetRange.max;
        }
    }
    
    if (!exchangeMode) return;
    
    // Setup exchange mode selection
    editSetupExchangeModeSelection();
    
    // Payment method checkboxes from opportunity.paymentModes
    const paymentModes = opportunity.paymentModes || (exchangeMode ? [exchangeMode] : []);
    setTimeout(() => {
        document.querySelectorAll('.payment-method-cb').forEach(cb => {
            cb.checked = paymentModes.indexOf(cb.value) !== -1;
        });
    }, 100);
    
    // Select the exchange mode
    setTimeout(() => {
        const card = document.querySelector(`.exchange-mode-card[data-mode="${exchangeMode}"]`);
        if (card) {
            card.click();
            
            // Populate exchange mode specific fields
            setTimeout(() => {
                
                if (exchangeMode === 'cash') {
                    if (exchangeData.cashAmount) {
                        const field = document.getElementById('cash-amount');
                        if (field) field.value = exchangeData.cashAmount;
                    }
                    if (exchangeData.cashPaymentTerms) {
                        const field = document.getElementById('cash-payment-terms');
                        if (field) field.value = exchangeData.cashPaymentTerms;
                    }
                    if (exchangeData.cashMilestones) {
                        const field = document.getElementById('cash-milestones');
                        if (field) {
                            field.value = exchangeData.cashMilestones;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('cash-milestones', exchangeData.cashMilestones);
                                }
                            }, 200);
                        }
                    }
                } else if (exchangeMode === 'equity') {
                    if (exchangeData.equityPercentage) {
                        const field = document.getElementById('equity-percentage');
                        if (field) field.value = exchangeData.equityPercentage;
                    }
                    if (exchangeData.equityVesting) {
                        const field = document.getElementById('equity-vesting');
                        if (field) field.value = exchangeData.equityVesting;
                    }
                    if (exchangeData.equityContribution) {
                        const field = document.getElementById('equity-contribution');
                        if (field) {
                            field.value = exchangeData.equityContribution;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('equity-contribution', exchangeData.equityContribution);
                                }
                            }, 200);
                        }
                    }
                    if (exchangeData.companyValuation) {
                        const field = document.getElementById('equity-company-valuation');
                        if (field) field.value = exchangeData.companyValuation;
                    }
                } else if (exchangeMode === 'profit_sharing') {
                    if (exchangeData.profitSplit) {
                        const field = document.getElementById('profit-split');
                        if (field) field.value = exchangeData.profitSplit;
                    }
                    if (exchangeData.profitBasis) {
                        const field = document.getElementById('profit-basis');
                        if (field) field.value = exchangeData.profitBasis;
                    }
                    if (exchangeData.profitDistribution) {
                        const field = document.getElementById('profit-distribution');
                        if (field) {
                            field.value = exchangeData.profitDistribution;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('profit-distribution', exchangeData.profitDistribution);
                                }
                            }, 200);
                        }
                    }
                    if (exchangeData.profitSharePercentage != null) {
                        const field = document.getElementById('profit-share-percentage');
                        if (field) field.value = exchangeData.profitSharePercentage;
                    }
                    if (exchangeData.expectedProfit) {
                        const field = document.getElementById('expected-profit');
                        if (field) field.value = exchangeData.expectedProfit;
                    }
                } else if (exchangeMode === 'barter') {
                    if (exchangeData.barterOffer) {
                        const field = document.getElementById('barter-offer');
                        if (field) {
                            field.value = exchangeData.barterOffer;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('barter-offer', exchangeData.barterOffer);
                                }
                            }, 200);
                        }
                    }
                    if (exchangeData.barterNeed) {
                        const field = document.getElementById('barter-need');
                        if (field) {
                            field.value = exchangeData.barterNeed;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('barter-need', exchangeData.barterNeed);
                                }
                            }, 200);
                        }
                    }
                    if (exchangeData.barterValue) {
                        const field = document.getElementById('barter-value');
                        if (field) field.value = exchangeData.barterValue;
                    }
                } else if (exchangeMode === 'hybrid') {
                    if (exchangeData.hybridCash) {
                        const field = document.getElementById('hybrid-cash');
                        if (field) field.value = exchangeData.hybridCash;
                    }
                    if (exchangeData.hybridEquity) {
                        const field = document.getElementById('hybrid-equity');
                        if (field) field.value = exchangeData.hybridEquity;
                    }
                    if (exchangeData.hybridBarter) {
                        const field = document.getElementById('hybrid-barter');
                        if (field) field.value = exchangeData.hybridBarter;
                    }
                    if (exchangeData.hybridCashDetails) {
                        const field = document.getElementById('hybrid-cash-details');
                        if (field) {
                            field.value = exchangeData.hybridCashDetails;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('hybrid-cash-details', exchangeData.hybridCashDetails);
                                }
                            }, 200);
                        }
                    }
                    if (exchangeData.hybridEquityDetails) {
                        const field = document.getElementById('hybrid-equity-details');
                        if (field) {
                            field.value = exchangeData.hybridEquityDetails;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('hybrid-equity-details', exchangeData.hybridEquityDetails);
                                }
                            }, 200);
                        }
                    }
                    if (exchangeData.hybridBarterDetails) {
                        const field = document.getElementById('hybrid-barter-details');
                        if (field) {
                            field.value = exchangeData.hybridBarterDetails;
                            setTimeout(() => {
                                if (window.RichTextEditor) {
                                    window.RichTextEditor.setContent('hybrid-barter-details', exchangeData.hybridBarterDetails);
                                }
                            }, 200);
                        }
                    }
                }
                
                // Set currency if available
                if (exchangeData.currency || opportunity.currency) {
                    const currencyField = document.getElementById('currency');
                    if (currencyField) {
                        currencyField.value = exchangeData.currency || opportunity.currency;
                    }
                }
                
                // Set exchange terms summary
                if (exchangeData.exchangeTermsSummary || opportunity.exchangeTermsSummary) {
                    const field = document.getElementById('exchange-terms-summary');
                    if (field) {
                        field.value = exchangeData.exchangeTermsSummary || opportunity.exchangeTermsSummary;
                        // Set content in rich text editor if it exists
                        setTimeout(() => {
                            if (window.RichTextEditor) {
                                window.RichTextEditor.setContent('exchange-terms-summary', field.value);
                            }
                        }, 200);
                    }
                }
                
                // Set agreement checkbox
                const agreementField = document.getElementById('exchange-agreement');
                if (agreementField) {
                    agreementField.checked = true;
                }
            }, 300);
        }
    }, 200);
}

function editSetupExchangeModeSelection() {
    const exchangeModeCards = document.querySelectorAll('.exchange-mode-card');
    const exchangeModeInput = document.getElementById('exchange-mode');
    const selectedDisplay = document.getElementById('selected-exchange-display');
    const clearButton = document.getElementById('clear-exchange-selection');
    const fieldsContainer = document.getElementById('exchange-mode-fields');
    const currencyGroup = document.getElementById('currency-group');
    
    if (!exchangeModeCards.length || !exchangeModeInput) return;
    
    let selectedMode = null;
    
    exchangeModeCards.forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            editSelectExchangeMode(mode);
        });
    });
    
    function editSelectExchangeMode(mode) {
        selectedMode = mode;
        exchangeModeInput.value = mode;
        
        // Update card selection
        exchangeModeCards.forEach(c => {
            c.classList.remove('selected');
            if (c.dataset.mode === mode) {
                c.classList.add('selected');
            }
        });
        
        // Update display
        const modeNames = {
            'cash': 'Cash',
            'equity': 'Equity',
            'profit_sharing': 'Profit-Sharing',
            'barter': 'Barter',
            'hybrid': 'Hybrid'
        };
        
        const nameElement = document.getElementById('selected-exchange-name');
        if (nameElement) {
            nameElement.textContent = modeNames[mode];
        }
        if (selectedDisplay) {
            selectedDisplay.classList.remove('hidden');
        }
        const primaryCb = document.querySelector(`.payment-method-cb[value="${mode}"]`);
        if (primaryCb && !primaryCb.checked) primaryCb.checked = true;

        // Render mode-specific fields (reuse from create form logic)
        editRenderExchangeModeFields(mode);
    }
    
    function editRenderExchangeModeFields(mode) {
        let html = '';
        
        switch(mode) {
            case 'cash':
                if (currencyGroup) currencyGroup.classList.remove('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="cash-amount" class="block text-sm font-medium text-gray-700 mb-2">Cash Amount <span class="text-red-600">*</span></label>
                            <input type="number" id="cash-amount" name="cashAmount" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 10000" step="0.01" required>
                            <p class="text-sm text-gray-500 mt-1">Enter the total cash amount</p>
                        </div>
                        <div class="form-group">
                            <label for="cash-payment-terms" class="block text-sm font-medium text-gray-700 mb-2">Payment Terms <span class="text-red-600">*</span></label>
                            <select id="cash-payment-terms" name="cashPaymentTerms" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" required>
                                <option value="">Select payment terms</option>
                                <option value="upfront">Upfront</option>
                                <option value="milestone_based">Milestone-Based</option>
                                <option value="upon_completion">Upon Completion</option>
                                <option value="monthly">Monthly</option>
                                <option value="installments">Installments</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="cash-milestones" class="block text-sm font-medium text-gray-700 mb-2">Payment Milestones</label>
                        <textarea id="cash-milestones" name="cashMilestones" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="3" placeholder="e.g., 50% upfront (5K SAR), 50% on completion (5K SAR)" data-rich-text="true"></textarea>
                        <p class="text-sm text-gray-500 mt-1">Describe payment schedule and milestones</p>
                    </div>
                `;
                break;
            case 'equity':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="equity-percentage" class="block text-sm font-medium text-gray-700 mb-2">Equity Percentage <span class="text-red-600">*</span></label>
                            <input type="number" id="equity-percentage" name="equityPercentage" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 40" min="0" max="100" step="0.1" required>
                            <p class="text-sm text-gray-500 mt-1">Percentage of ownership stake</p>
                        </div>
                        <div class="form-group">
                            <label for="equity-company-valuation" class="block text-sm font-medium text-gray-700 mb-2">Company Valuation (SAR)</label>
                            <input type="text" id="equity-company-valuation" name="companyValuation" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 5000000">
                            <p class="text-sm text-gray-500 mt-1">Used to calculate estimated value</p>
                        </div>
                        <div class="form-group">
                            <label for="equity-vesting" class="block text-sm font-medium text-gray-700 mb-2">Vesting Period</label>
                            <select id="equity-vesting" name="equityVesting" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="">Select vesting period</option>
                                <option value="immediate">Immediate</option>
                                <option value="1_year">1 Year</option>
                                <option value="2_years">2 Years</option>
                                <option value="3_years">3 Years</option>
                                <option value="4_years">4 Years</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="equity-contribution" class="block text-sm font-medium text-gray-700 mb-2">Contribution Description</label>
                        <textarea id="equity-contribution" name="equityContribution" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="3" placeholder="e.g., Join our JV: 40% equity for expertise + equipment" data-rich-text="true"></textarea>
                        <p class="text-sm text-gray-500 mt-1">Describe what contribution earns this equity stake</p>
                    </div>
                `;
                break;
            case 'profit_sharing':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="profit-split" class="block text-sm font-medium text-gray-700 mb-2">Profit Split (e.g. 60-40) <span class="text-red-600">*</span></label>
                            <input type="text" id="profit-split" name="profitSplit" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 60-40 or 50-30-20" required>
                            <p class="text-sm text-gray-500 mt-1">Enter profit split</p>
                        </div>
                        <div class="form-group">
                            <label for="profit-share-percentage" class="block text-sm font-medium text-gray-700 mb-2">Partner Share % (for value estimate)</label>
                            <input type="number" id="profit-share-percentage" name="profitSharePercentage" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 10" min="0" max="100" step="0.1">
                        </div>
                        <div class="form-group">
                            <label for="expected-profit" class="block text-sm font-medium text-gray-700 mb-2">Expected Profit (SAR)</label>
                            <input type="text" id="expected-profit" name="expectedProfit" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 2000000">
                        </div>
                        <div class="form-group">
                            <label for="profit-basis" class="block text-sm font-medium text-gray-700 mb-2">Profit Basis</label>
                            <select id="profit-basis" name="profitBasis" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="revenue">Revenue Share</option>
                                <option value="profit">Profit Share (After Costs)</option>
                                <option value="gross_profit">Gross Profit Share</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profit-distribution" class="block text-sm font-medium text-gray-700 mb-2">Distribution Schedule</label>
                        <textarea id="profit-distribution" name="profitDistribution" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="3" placeholder="e.g., Consortium: 60-40 profit split after costs, distributed quarterly" data-rich-text="true"></textarea>
                        <p class="text-sm text-gray-500 mt-1">Describe how and when profits will be distributed</p>
                    </div>
                `;
                break;
            case 'barter':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="barter-offer" class="block text-sm font-medium text-gray-700 mb-2">What You Offer <span class="text-red-600">*</span></label>
                            <textarea id="barter-offer" name="barterOffer" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="3" placeholder="e.g., Office space, equipment, services..." required data-rich-text="true"></textarea>
                            <p class="text-sm text-gray-500 mt-2 form-help">Describe what you're offering in exchange</p>
                        </div>
                        <div class="form-group">
                            <label for="barter-need" class="block text-sm font-medium text-gray-700 mb-2">What You Need <span class="text-red-600">*</span></label>
                            <textarea id="barter-need" name="barterNeed" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="3" placeholder="e.g., Structural engineering services..." required data-rich-text="true"></textarea>
                            <p class="text-sm text-gray-500 mt-2 form-help">Describe what you need in return</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="barter-value" class="block text-sm font-medium text-gray-700 mb-2">Estimated Value (Optional)</label>
                        <input type="text" id="barter-value" name="barterValue" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., Equivalent to 50K SAR">
                        <p class="text-sm text-gray-500 mt-2 form-help">Optional: Estimated equivalent value</p>
                    </div>
                `;
                break;
            case 'hybrid':
                if (currencyGroup) currencyGroup.classList.remove('hidden');
                html = `
                    <div class="mb-6">
                        <p class="text-sm font-medium text-gray-700 mb-4">Define the mix of exchange modes (must total 100%)</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="form-group">
                                <label for="hybrid-cash" class="block text-sm font-medium text-gray-700 mb-2">Cash Percentage</label>
                                <input type="number" id="hybrid-cash" name="hybridCash" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 30" min="0" max="100" step="0.1">
                                <p class="text-sm text-gray-500 mt-1">%</p>
                            </div>
                            <div class="form-group">
                                <label for="hybrid-equity" class="block text-sm font-medium text-gray-700 mb-2">Equity Percentage</label>
                                <input type="number" id="hybrid-equity" name="hybridEquity" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 50" min="0" max="100" step="0.1">
                                <p class="text-sm text-gray-500 mt-1">%</p>
                            </div>
                            <div class="form-group">
                                <label for="hybrid-barter" class="block text-sm font-medium text-gray-700 mb-2">Barter Percentage</label>
                                <input type="number" id="hybrid-barter" name="hybridBarter" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 20" min="0" max="100" step="0.1">
                                <p class="text-sm text-gray-500 mt-1">%</p>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p class="text-sm text-gray-700">
                                <span class="font-semibold">Total: </span>
                                <span id="hybrid-total">0%</span>
                            </p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="hybrid-cash-details" class="block text-sm font-medium text-gray-700 mb-2">Cash Details</label>
                            <textarea id="hybrid-cash-details" name="hybridCashDetails" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="2" placeholder="e.g., 30% cash upfront" data-rich-text="true"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="hybrid-equity-details" class="block text-sm font-medium text-gray-700 mb-2">Equity Details</label>
                            <textarea id="hybrid-equity-details" name="hybridEquityDetails" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="2" placeholder="e.g., 50% equity stake" data-rich-text="true"></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="hybrid-barter-details" class="block text-sm font-medium text-gray-700 mb-2">Barter Details</label>
                        <textarea id="hybrid-barter-details" name="hybridBarterDetails" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="2" placeholder="e.g., 20% in-kind services" data-rich-text="true"></textarea>
                    </div>
                `;
                
                // Add total calculation for hybrid mode
                setTimeout(() => {
                    const cashInput = document.getElementById('hybrid-cash');
                    const equityInput = document.getElementById('hybrid-equity');
                    const barterInput = document.getElementById('hybrid-barter');
                    const totalDisplay = document.getElementById('hybrid-total');
                    
                    function updateTotal() {
                        const cash = parseFloat(cashInput?.value || 0);
                        const equity = parseFloat(equityInput?.value || 0);
                        const barter = parseFloat(barterInput?.value || 0);
                        const total = cash + equity + barter;
                        if (totalDisplay) {
                            totalDisplay.textContent = `${total.toFixed(1)}%`;
                            const parent = totalDisplay.parentElement;
                            if (total === 100) {
                                parent.classList.remove('bg-blue-50', 'border-blue-200');
                                parent.classList.add('bg-green-50', 'border-green-200');
                            } else {
                                parent.classList.remove('bg-green-50', 'border-green-200');
                                parent.classList.add('bg-blue-50', 'border-blue-200');
                            }
                        }
                    }
                    
                    if (cashInput) cashInput.addEventListener('input', updateTotal);
                    if (equityInput) equityInput.addEventListener('input', updateTotal);
                    if (barterInput) barterInput.addEventListener('input', updateTotal);
                }, 100);
                break;
        }
        
        if (fieldsContainer) {
            fieldsContainer.innerHTML = html;
            
            // Initialize rich text editors for newly rendered fields
            setTimeout(() => {
                if (window.RichTextEditor) {
                    window.RichTextEditor.initAll();
                }
            }, 100);
        }
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            selectedMode = null;
            exchangeModeInput.value = '';
            exchangeModeCards.forEach(c => c.classList.remove('selected'));
            if (selectedDisplay) selectedDisplay.classList.add('hidden');
            if (fieldsContainer) {
                fieldsContainer.innerHTML = '<p class="text-gray-500 italic">Please select an exchange mode to see specific fields.</p>';
            }
            if (currencyGroup) currencyGroup.classList.add('hidden');
        });
    }
}

function editSetupFormHandlers() {
    const form = document.getElementById('opportunity-edit-form');
    const cancelBtn = document.getElementById('cancel-edit');
    const deleteBtn = document.getElementById('delete-opportunity');
    
    if (!form) return;
    
    // Cancel button
    cancelBtn?.addEventListener('click', () => {
        if (editingOpportunity) {
            router.navigate(`/opportunities/${editingOpportunity.id}`);
        } else {
            router.navigate('/opportunities');
        }
    });
    
    // Delete button
    deleteBtn?.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
            return;
        }
        
        try {
            const deleted = await dataService.deleteOpportunity(editingOpportunity.id);
            if (deleted) {
                alert('Opportunity deleted successfully');
                router.navigate('/opportunities');
            } else {
                throw new Error('Failed to delete opportunity');
            }
        } catch (error) {
            console.error('Error deleting opportunity:', error);
            alert('Failed to delete opportunity: ' + error.message);
        }
    });
    
    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const errorDiv = document.getElementById('form-error');
        const successDiv = document.getElementById('form-success');
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        try {
            const formService = window.opportunityFormService;
            const formData = formService.collectFormData(form);
            
            // Get current user
            const user = authService.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to edit an opportunity');
            }
            
            if (!formData.title) {
                throw new Error('Title is required');
            }
            
            // Collect exchange mode data
            const exchangeData = {
                exchangeMode: formData.exchangeMode,
                currency: formData.currency || 'SAR',
                exchangeTermsSummary: formData.exchangeTermsSummary || '',
                // Budget range from exchange section
                budgetRange: {
                    min: parseFloat(formData.budgetRange_min) || 0,
                    max: parseFloat(formData.budgetRange_max) || 0,
                    currency: formData.currency || 'SAR'
                }
            };
            
            // Add mode-specific fields
            if (formData.exchangeMode === 'cash') {
                exchangeData.cashAmount = parseFloat(formData.cashAmount);
                exchangeData.cashPaymentTerms = formData.cashPaymentTerms;
                exchangeData.cashMilestones = formData.cashMilestones || '';
            } else if (formData.exchangeMode === 'equity') {
                exchangeData.equityPercentage = parseFloat(formData.equityPercentage);
                exchangeData.equityVesting = formData.equityVesting || '';
                exchangeData.equityContribution = formData.equityContribution || '';
                const companyValEl = document.getElementById('equity-company-valuation');
                if (companyValEl?.value) exchangeData.companyValuation = companyValEl.value.trim();
            } else if (formData.exchangeMode === 'profit_sharing') {
                exchangeData.profitSplit = formData.profitSplit;
                exchangeData.profitBasis = formData.profitBasis || 'profit';
                exchangeData.profitDistribution = formData.profitDistribution || '';
                const sharePctEl = document.getElementById('profit-share-percentage');
                const expectedProfitEl = document.getElementById('expected-profit');
                if (sharePctEl?.value) exchangeData.profitSharePercentage = parseFloat(sharePctEl.value) || null;
                if (expectedProfitEl?.value) exchangeData.expectedProfit = expectedProfitEl.value.trim();
            } else if (formData.exchangeMode === 'barter') {
                exchangeData.barterOffer = formData.barterOffer;
                exchangeData.barterNeed = formData.barterNeed;
                exchangeData.barterValue = formData.barterValue || '';
            } else if (formData.exchangeMode === 'hybrid') {
                exchangeData.hybridCash = parseFloat(formData.hybridCash || 0);
                exchangeData.hybridEquity = parseFloat(formData.hybridEquity || 0);
                exchangeData.hybridBarter = parseFloat(formData.hybridBarter || 0);
                exchangeData.hybridCashDetails = formData.hybridCashDetails || '';
                exchangeData.hybridEquityDetails = formData.hybridEquityDetails || '';
                exchangeData.hybridBarterDetails = formData.hybridBarterDetails || '';
            }

            let value_exchange = null;
            const estimator = window.valueEstimator;
            if (estimator) {
                const valueExpected = (editingOpportunity.value_exchange && editingOpportunity.value_exchange.value_expected) || [];
                value_exchange = estimator.buildValueExchange(exchangeData, formData.exchangeMode, valueExpected);
                if (formData.exchangeMode === 'hybrid' && !estimator.validateHybrid(exchangeData)) {
                    throw new Error('Hybrid mode must include at least 2 value types with non-zero percentages.');
                }
                if (value_exchange.estimated_value != null && exchangeData.budgetRange && !estimator.isWithinBudgetRange(value_exchange.estimated_value, exchangeData.budgetRange)) {
                    const min = exchangeData.budgetRange.min;
                    const max = exchangeData.budgetRange.max;
                    if (!confirm('Estimated value is outside the budget range. Continue anyway?')) return;
                }
            }
            
            // Update location string
            editUpdateLocationString();
            
            // Common attributes: key dates and location requirement
            const locationRequirement = document.getElementById('location-requirement')?.value?.trim();
            const attrStartDate = document.getElementById('attr-startDate')?.value?.trim();
            const attrApplicationDeadline = document.getElementById('attr-applicationDeadline')?.value?.trim();
            const attrEndDate = document.getElementById('attr-endDate')?.value?.trim();
            if (locationRequirement) formData.locationRequirement = locationRequirement;
            if (attrStartDate) formData.startDate = attrStartDate;
            if (attrApplicationDeadline) formData.applicationDeadline = attrApplicationDeadline;
            if (attrEndDate) formData.endDate = attrEndDate;
            
            // paymentModes: same shape as create — canonical set, primary mode always included
            const validModes = ['cash', 'equity', 'profit_sharing', 'barter', 'hybrid'];
            const paymentMethodCheckboxes = document.querySelectorAll('.payment-method-cb:checked');
            let paymentModes = paymentMethodCheckboxes.length > 0
                ? Array.from(paymentMethodCheckboxes).map(cb => cb.value).filter(m => validModes.includes(m))
                : (formData.exchangeMode ? [formData.exchangeMode] : (editingOpportunity.paymentModes || (editingOpportunity.exchangeMode ? [editingOpportunity.exchangeMode] : ['cash'])));
            const primaryMode = formData.exchangeMode || editingOpportunity.exchangeMode;
            if (primaryMode && !paymentModes.includes(primaryMode)) paymentModes = [primaryMode, ...paymentModes];
            
            // scope for matching: from form (attributes) or existing opportunity
            const attrs = formData || {};
            const arr = (v) => (Array.isArray(v) ? v : (v ? [v] : []));
            const scope = {
                requiredSkills: arr(attrs.requiredSkills).length ? arr(attrs.requiredSkills) : (editingOpportunity.scope && editingOpportunity.scope.requiredSkills) || arr((editingOpportunity.attributes || {}).requiredSkills),
                offeredSkills: arr(attrs.offeredSkills).length ? arr(attrs.offeredSkills) : (editingOpportunity.scope && editingOpportunity.scope.offeredSkills) || arr((editingOpportunity.attributes || {}).offeredSkills),
                sectors: arr(attrs.sectors).length ? arr(attrs.sectors) : (editingOpportunity.scope && editingOpportunity.scope.sectors) || arr((editingOpportunity.attributes || {}).sectors),
                certifications: arr(attrs.certifications).length ? arr(attrs.certifications) : (editingOpportunity.scope && editingOpportunity.scope.certifications) || arr((editingOpportunity.attributes || {}).certifications),
                interests: arr(attrs.interests).length ? arr(attrs.interests) : (editingOpportunity.scope && editingOpportunity.scope.interests) || arr((editingOpportunity.attributes || {}).interests)
            };
            
            // Update opportunity
            const editLatVal = parseFloat(document.getElementById('latitude')?.value);
            const editLngVal = parseFloat(document.getElementById('longitude')?.value);

            const updates = {
                title: formData.title,
                description: formData.description || '',
                status: formData.status || editingOpportunity.status,
                location: formData.location || '',
                locationCountry: formData.locationCountry,
                locationRegion: formData.locationRegion,
                locationCity: formData.locationCity,
                locationDistrict: formData.locationDistrict || '',
                latitude: isNaN(editLatVal) ? null : editLatVal,
                longitude: isNaN(editLngVal) ? null : editLngVal,
                exchangeMode: formData.exchangeMode,
                exchangeData: exchangeData,
                paymentModes,
                scope,
                attributes: formData,
                modelData: formData
            };
            if (value_exchange) updates.value_exchange = value_exchange;
            
            const updated = await dataService.updateOpportunity(editingOpportunity.id, updates);
            
            if (!updated) {
                throw new Error('Failed to update opportunity');
            }

            // When saving as published, matching is triggered inside dataService.updateOpportunity
            // (opportunity-edit sends full updates including status, so we rely on that hook)
            
            // Create audit log
            await dataService.createAuditLog({
                userId: user.id,
                action: 'opportunity_updated',
                entityType: 'opportunity',
                entityId: editingOpportunity.id,
                details: { title: formData.title, changes: Object.keys(updates) }
            });
            
            // Show success message
            successDiv.textContent = 'Opportunity updated successfully!';
            successDiv.classList.remove('hidden');
            
            // Redirect after 1.5 seconds
            setTimeout(() => {
                router.navigate(`/opportunities/${editingOpportunity.id}`);
            }, 1500);
            
        } catch (error) {
            console.error('Error updating opportunity:', error);
            errorDiv.textContent = error.message || 'Failed to update opportunity. Please try again.';
            errorDiv.classList.remove('hidden');
        }
    });
}

function editShowError(message) {
    const loadingDiv = document.getElementById('edit-loading');
    const errorDiv = document.getElementById('edit-error');
    
    if (loadingDiv) loadingDiv.classList.add('hidden');
    if (errorDiv) {
        errorDiv.classList.remove('hidden');
        const p = errorDiv.querySelector('p');
        if (p) p.textContent = message;
    }
}

let editMapInstance = null;

function editInitMapPicker(opportunity) {
    if (typeof mapService === 'undefined') return;

    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    const coordsDisplay = document.getElementById('map-coordinates-display');
    const latDisplay = document.getElementById('map-lat-display');
    const lngDisplay = document.getElementById('map-lng-display');
    const addressInput = document.getElementById('address-search-input');
    const addressBtn = document.getElementById('address-search-btn');

    function updateCoords(lat, lng) {
        if (latInput) latInput.value = lat.toFixed(6);
        if (lngInput) lngInput.value = lng.toFixed(6);
        if (latDisplay) latDisplay.textContent = lat.toFixed(6);
        if (lngDisplay) lngDisplay.textContent = lng.toFixed(6);
        if (coordsDisplay) coordsDisplay.classList.remove('hidden');
    }

    const hasCoords = opportunity.latitude && opportunity.longitude;
    const initialMarker = hasCoords ? [opportunity.latitude, opportunity.longitude] : null;

    editMapInstance = mapService.initMapPicker('location-map', {
        center: hasCoords ? [opportunity.latitude, opportunity.longitude] : mapService.DEFAULT_CENTER,
        zoom: hasCoords ? 12 : mapService.DEFAULT_ZOOM,
        draggableMarker: true,
        initialMarker,
        onClick: (lat, lng) => updateCoords(lat, lng),
        onMarkerMove: (lat, lng) => updateCoords(lat, lng)
    });

    if (hasCoords) {
        updateCoords(opportunity.latitude, opportunity.longitude);
    }

    if (addressBtn && addressInput) {
        const doGeocode = async () => {
            const query = addressInput.value.trim();
            if (!query) return;
            addressBtn.disabled = true;
            addressBtn.innerHTML = '<i class="ph-duotone ph-spinner ph-spin" style="font-size:16px;"></i> Searching...';
            const result = await mapService.geocodeAddress(query);
            addressBtn.disabled = false;
            addressBtn.innerHTML = '<i class="ph-duotone ph-magnifying-glass" style="font-size:16px;"></i> Locate';
            if (result) {
                editMapInstance.setMarker(result.lat, result.lng);
                updateCoords(result.lat, result.lng);
            } else {
                alert('Address not found. Try a different search term.');
            }
        };
        addressBtn.addEventListener('click', doGeocode);
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doGeocode(); }
        });
    }
}

function editLoadScript(src) {
    const basePath = window.CONFIG?.BASE_PATH || '';
    const fullSrc = basePath + src;
    
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${fullSrc}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = fullSrc;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
