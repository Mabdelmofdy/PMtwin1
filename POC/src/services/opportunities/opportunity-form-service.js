/**
 * Opportunity Form Service
 * Handles dynamic form generation for all opportunity models
 */

class OpportunityFormService {
    constructor() {
        this.models = window.OPPORTUNITY_MODELS || OPPORTUNITY_MODELS;
        this.lookups = null;
    }
    
    /**
     * Set lookups data from JSON
     */
    setLookups(lookups) {
        this.lookups = lookups;
    }

    escapeHtml(str) {
        if (str == null) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    escapeAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    /**
     * Get options for a field, checking lookups first
     */
    getOptions(attribute) {
        const { options, lookupKey } = attribute;
        
        // If lookupKey is specified, use lookups data
        if (lookupKey && this.lookups && this.lookups[lookupKey]) {
            return this.lookups[lookupKey];
        }
        
        // Otherwise use provided options
        return options || [];
    }
    
    /**
     * Get collaboration model overrides from system settings (enabled, label, order)
     */
    getCollaborationModelOverrides() {
        try {
            const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
            const key = window.CONFIG?.STORAGE_KEYS?.SYSTEM_SETTINGS;
            if (!storage || !key) return {};
            const settings = storage.get(key) || {};
            return settings.collaborationModels || {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Get all models, filtered by admin-enabled and sorted by order; uses custom labels when set
     */
    getModels() {
        const overrides = this.getCollaborationModelOverrides();
        const keys = Object.keys(this.models).filter(key => {
            const o = overrides[key];
            return o === undefined || o.enabled !== false;
        });
        keys.sort((a, b) => {
            const orderA = overrides[a]?.order ?? 999;
            const orderB = overrides[b]?.order ?? 999;
            return orderA - orderB;
        });
        return keys.map(key => ({
            key,
            name: (overrides[key] && overrides[key].label) || this.models[key].name,
            subModels: Object.keys(this.models[key].subModels).map(subKey => ({
                key: subKey,
                name: this.models[key].subModels[subKey].name
            }))
        }));
    }
    
    /**
     * Get models filtered by entity-type eligibility.
     * Ineligible sub-models are marked with { eligible: false, reason } instead of removed,
     * so the UI can show them as disabled with a tooltip.
     */
    getFilteredModels(userType) {
        const models = this.getModels();
        const eligibility = (window.CONFIG && window.CONFIG.MODEL_ELIGIBILITY) || {};

        return models.map(model => ({
            ...model,
            subModels: model.subModels.map(sub => {
                const rule = eligibility[sub.key];
                if (rule && userType && !rule.allowedEntityTypes.includes(userType)) {
                    return { ...sub, eligible: false, reason: rule.reason };
                }
                return { ...sub, eligible: true, reason: null };
            })
        }));
    }

    /**
     * Get attributes for a sub-model
     */
    getAttributes(modelKey, subModelKey) {
        if (!this.models[modelKey] || !this.models[modelKey].subModels[subModelKey]) {
            return [];
        }
        return this.models[modelKey].subModels[subModelKey].attributes;
    }
    
    /**
     * Render form field
     */
    renderField(attribute, value = '') {
        const { key, label, type, required, options, maxLength, min, conditional } = attribute;
        
        let fieldHTML = '';
        const requiredAttr = required ? 'required' : '';
        const maxLengthAttr = maxLength ? `maxlength="${maxLength}"` : '';
        const minAttr = min ? `min="${min}"` : '';
        
        switch (type) {
            case 'text':
                fieldHTML = `
                    <input 
                        type="text" 
                        id="${key}" 
                        name="${key}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                        value="${value || ''}"
                        ${requiredAttr}
                        ${maxLengthAttr}
                        placeholder="${label}"
                    >
                `;
                break;
                
            case 'textarea':
                // Add data-rich-text attribute for long textareas or fields that benefit from rich formatting
                // Include fields with maxLength > 300 or specific keywords
                const isLongField = maxLength > 300 || 
                    key.toLowerCase().includes('description') || 
                    key.toLowerCase().includes('scope') || 
                    key.toLowerCase().includes('details') || 
                    key.toLowerCase().includes('summary') ||
                    key.toLowerCase().includes('milestones') ||
                    key.toLowerCase().includes('distribution') ||
                    key.toLowerCase().includes('contribution') ||
                    key.toLowerCase().includes('terms') ||
                    key.toLowerCase().includes('offer') ||
                    key.toLowerCase().includes('need') ||
                    key.toLowerCase().includes('notes') ||
                    key.toLowerCase().includes('requirements') ||
                    key.toLowerCase().includes('deliverables') ||
                    key.toLowerCase().includes('agreement') ||
                    key.toLowerCase().includes('conditions');
                const richTextAttr = isLongField ? 'data-rich-text="true"' : '';
                
                fieldHTML = `
                    <textarea 
                        id="${key}" 
                        name="${key}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                        ${requiredAttr}
                        ${maxLengthAttr}
                        rows="4"
                        placeholder="${label}"
                        ${richTextAttr}
                    >${value || ''}</textarea>
                `;
                break;
                
            case 'number':
                fieldHTML = `
                    <input 
                        type="number" 
                        id="${key}" 
                        name="${key}" 
                        class="form-input" 
                        value="${value || ''}"
                        ${requiredAttr}
                        ${minAttr}
                        placeholder="${label}"
                    >
                `;
                break;
                
            case 'currency':
                fieldHTML = `
                    <input 
                        type="number" 
                        id="${key}" 
                        name="${key}" 
                        class="form-input" 
                        value="${value || ''}"
                        ${requiredAttr}
                        ${minAttr}
                        step="0.01"
                        placeholder="${label} (SAR)"
                    >
                `;
                break;
                
            case 'currency-range':
                fieldHTML = `
                    <div class="currency-range">
                        <input 
                            type="number" 
                            id="${key}_min" 
                            name="${key}_min" 
                            class="form-input" 
                            value="${value?.min || ''}"
                            ${requiredAttr}
                            step="0.01"
                            placeholder="Min (SAR)"
                        >
                        <span>to</span>
                        <input 
                            type="number" 
                            id="${key}_max" 
                            name="${key}_max" 
                            class="form-input" 
                            value="${value?.max || ''}"
                            ${requiredAttr}
                            step="0.01"
                            placeholder="Max (SAR)"
                        >
                    </div>
                `;
                break;
                
            case 'date':
                fieldHTML = `
                    <input 
                        type="date" 
                        id="${key}" 
                        name="${key}" 
                        class="form-input" 
                        value="${value || ''}"
                        ${requiredAttr}
                    >
                `;
                break;
                
            case 'date-range':
                fieldHTML = `
                    <div class="date-range">
                        <input 
                            type="date" 
                            id="${key}_start" 
                            name="${key}_start" 
                            class="form-input" 
                            value="${value?.start || ''}"
                            ${requiredAttr}
                        >
                        <span>to</span>
                        <input 
                            type="date" 
                            id="${key}_end" 
                            name="${key}_end" 
                            class="form-input" 
                            value="${value?.end || ''}"
                            ${requiredAttr}
                        >
                    </div>
                `;
                break;
                
            case 'select':
                const selectOptions = this.getOptions(attribute);
                const optionsHTML = selectOptions.map(opt => 
                    `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                ).join('');
                fieldHTML = `
                    <select 
                        id="${key}" 
                        name="${key}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                        ${requiredAttr}
                    >
                        <option value="">Select ${label}</option>
                        ${optionsHTML}
                    </select>
                `;
                break;
                
            case 'multi-select': {
                const multiSelectOptions = this.getOptions(attribute);
                const selectedVals = Array.isArray(value)
                    ? value
                    : (typeof value === 'string' && value.trim()
                        ? value.split(',').map(s => s.trim()).filter(Boolean)
                        : []);
                const chips = multiSelectOptions.map(opt => {
                    const esc = this.escapeHtml(opt);
                    const attrV = this.escapeAttr(opt);
                    const checked = selectedVals.includes(opt) ? 'checked' : '';
                    return `
                        <label class="occ-ms-chip">
                            <input type="checkbox" class="occ-ms-option" value="${attrV}" ${checked}>
                            <span>${esc}</span>
                        </label>`;
                }).join('');
                fieldHTML = `
                    <div class="occ-ms-field" data-field-key="${this.escapeAttr(key)}" id="${this.escapeAttr(key)}-multi" role="group">
                        <div class="occ-ms-chip-grid">${chips}</div>
                        <p class="occ-ms-hint">Tap to toggle each option — no keyboard shortcut needed.</p>
                    </div>
                `;
                break;
            }

            case 'boolean': {
                const on = value === true || value === 'true' || value === 1 || value === '1';
                fieldHTML = `
                    <div class="occ-bool-field">
                        <label class="occ-switch" for="${this.escapeAttr(key)}">
                            <input 
                                type="checkbox" 
                                id="${this.escapeAttr(key)}" 
                                name="${this.escapeAttr(key)}" 
                                class="occ-switch-input"
                                ${on ? 'checked' : ''}
                                ${requiredAttr}
                            >
                            <span class="occ-switch-track" aria-hidden="true"></span>
                        </label>
                        <span class="occ-bool-state" data-for="${this.escapeAttr(key)}">${on ? 'Yes' : 'No'}</span>
                    </div>
                `;
                break;
            }
                
            case 'tags':
                const tagsValue = Array.isArray(value) ? value.join(', ') : value || '';
                fieldHTML = `
                    <input 
                        type="text" 
                        id="${key}" 
                        name="${key}" 
                        class="form-input" 
                        value="${tagsValue}"
                        ${requiredAttr}
                        placeholder="Comma-separated values (e.g., BIM, AutoCAD, Project Management)"
                    >
                    <small class="form-help">Enter comma-separated values</small>
                `;
                break;
                
            case 'array-percentages':
                const percentagesValue = Array.isArray(value) ? value.join(', ') : value || '';
                fieldHTML = `
                    <input 
                        type="text" 
                        id="${key}" 
                        name="${key}" 
                        class="form-input" 
                        value="${percentagesValue}"
                        ${requiredAttr}
                        placeholder="Comma-separated percentages (e.g., 50, 50 or 60, 40)"
                    >
                    <small class="form-help">Enter comma-separated percentages (must sum to 100)</small>
                `;
                break;
                
            case 'array-objects':
                fieldHTML = `
                    <div id="${key}_container" class="array-objects-container occ-array-container">
                        ${this.renderArrayObjectsField(key, value || [])}
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm occ-array-add-btn" onclick="opportunityFormService.addArrayObject('${key}')">
                        + Add item
                    </button>
                `;
                break;
                
            default:
                fieldHTML = `<input type="text" id="${key}" name="${key}" class="form-input" value="${value || ''}" ${requiredAttr}>`;
        }
        
        // Add conditional display logic
        let conditionalAttr = '';
        if (conditional) {
            conditionalAttr = `data-conditional-field="${conditional.field}" data-conditional-value="${conditional.value.join(',')}"`;
        }
        
        const labelText = this.escapeHtml(label);
        const labelBlock = (type === 'boolean' || type === 'multi-select' || type === 'array-objects')
            ? `<div class="form-label occ-model-field-label">${labelText}${required ? '<span class="text-red-600">*</span>' : ''}</div>`
            : `<label for="${this.escapeAttr(key)}" class="form-label">${labelText}${required ? '<span class="text-red-600">*</span>' : ''}</label>`;

        return `
            <div class="form-group occ-model-field occ-model-field--${this.escapeAttr(type)}" ${conditionalAttr} ${conditional ? 'style="display: none;"' : ''}>
                ${labelBlock}
                ${fieldHTML}
            </div>
        `;
    }
    
    /**
     * Render array objects field
     */
    renderArrayObjectsField(key, values) {
        if (!values || values.length === 0) {
            return `
                <div class="occ-array-empty">
                    <p class="occ-array-empty-title">No items yet</p>
                    <p class="occ-array-empty-hint">Use <strong>Add item</strong> to add partner requirements, contributions, or roles.</p>
                </div>`;
        }

        return values.map((item, index) => `
            <div class="array-object-item occ-array-row" data-index="${index}">
                <input type="text" name="${key}[${index}][label]" value="${this.escapeAttr(item.label || '')}" placeholder="Label (e.g. Minimum turnover)" class="form-input occ-array-input">
                <input type="text" name="${key}[${index}][value]" value="${this.escapeAttr(item.value || '')}" placeholder="Value / detail" class="form-input occ-array-input">
                <button type="button" class="btn btn-secondary btn-sm occ-array-remove" onclick="opportunityFormService.removeArrayObject('${key}', ${index})" aria-label="Remove row">Remove</button>
            </div>
        `).join('');
    }
    
    /**
     * Add array object item
     */
    addArrayObject(key) {
        const container = document.getElementById(`${key}_container`);
        if (!container) return;

        const empty = container.querySelector('.occ-array-empty');
        if (empty) empty.remove();

        const index = container.querySelectorAll('.array-object-item').length;
        const itemHTML = `
            <div class="array-object-item occ-array-row" data-index="${index}">
                <input type="text" name="${key}[${index}][label]" placeholder="Label (e.g. Minimum turnover)" class="form-input occ-array-input">
                <input type="text" name="${key}[${index}][value]" placeholder="Value / detail" class="form-input occ-array-input">
                <button type="button" class="btn btn-secondary btn-sm occ-array-remove" onclick="opportunityFormService.removeArrayObject('${key}', ${index})" aria-label="Remove row">Remove</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    }
    
    /**
     * Remove array object item
     */
    removeArrayObject(key, index) {
        const container = document.getElementById(`${key}_container`);
        if (!container) return;

        const item = container.querySelector(`[data-index="${index}"]`);
        if (item) {
            item.remove();
            container.querySelectorAll('.array-object-item').forEach((el, i) => {
                el.dataset.index = i;
                el.querySelectorAll('input').forEach(input => {
                    const name = input.name.replace(/\[\d+\]/, `[${i}]`);
                    input.name = name;
                });
                const btn = el.querySelector('.occ-array-remove');
                if (btn) btn.setAttribute('onclick', `opportunityFormService.removeArrayObject('${key}', ${i})`);
            });
        }
        if (container.querySelectorAll('.array-object-item').length === 0) {
            container.innerHTML = this.renderArrayObjectsField(key, []);
        }
    }
    
    /**
     * Toggle labels for boolean switch fields after dynamic render
     */
    wireDynamicBehaviours(root = document) {
        root.querySelectorAll('.occ-switch-input').forEach(cb => {
            const span = root.querySelector(`.occ-bool-state[data-for="${cb.id}"]`);
            const sync = () => {
                if (span) span.textContent = cb.checked ? 'Yes' : 'No';
            };
            sync();
            if (cb._occBoolSync) cb.removeEventListener('change', cb._occBoolSync);
            cb._occBoolSync = sync;
            cb.addEventListener('change', sync);
        });
    }

    /**
     * Handle conditional fields
     */
    setupConditionalFields(formElement) {
        const conditionalFields = formElement.querySelectorAll('[data-conditional-field]');
        
        conditionalFields.forEach(field => {
            const conditionalFieldName = field.dataset.conditionalField;
            const conditionalValues = field.dataset.conditionalValue.split(',');
            
            const watchField = formElement.querySelector(`[name="${conditionalFieldName}"]`);
            if (watchField) {
                const updateVisibility = () => {
                    const watchValue = watchField.type === 'checkbox' ? watchField.checked : watchField.value;
                    const shouldShow = conditionalValues.includes(watchValue);
                    field.style.display = shouldShow ? 'block' : 'none';
                };
                
                watchField.addEventListener('change', updateVisibility);
                updateVisibility(); // Initial check
            }
        });
    }
    
    /**
     * Collect form data
     */
    collectFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            // Handle array notation
            if (key.includes('[')) {
                const match = key.match(/^(\w+)\[(\d+)\]\[(\w+)\]$/);
                if (match) {
                    const [, arrayKey, index, prop] = match;
                    if (!data[arrayKey]) data[arrayKey] = [];
                    if (!data[arrayKey][index]) data[arrayKey][index] = {};
                    data[arrayKey][index][prop] = value;
                } else {
                    // Handle simple arrays
                    const match2 = key.match(/^(\w+)\[(\d+)\]$/);
                    if (match2) {
                        const [, arrayKey, index] = match2;
                        if (!data[arrayKey]) data[arrayKey] = [];
                        data[arrayKey][index] = value;
                    } else {
                        data[key] = value;
                    }
                }
            } else {
                data[key] = value;
            }
        }
        
        // Handle special field types
        Object.keys(data).forEach(key => {
            // Currency ranges
            if (data[`${key}_min`] && data[`${key}_max`]) {
                data[key] = {
                    min: parseFloat(data[`${key}_min`]),
                    max: parseFloat(data[`${key}_max`])
                };
                delete data[`${key}_min`];
                delete data[`${key}_max`];
            }
            
            // Date ranges
            if (data[`${key}_start`] && data[`${key}_end`]) {
                data[key] = {
                    start: data[`${key}_start`],
                    end: data[`${key}_end`]
                };
                delete data[`${key}_start`];
                delete data[`${key}_end`];
            }
            
            // Tags (comma-separated strings)
            if (typeof data[key] === 'string' && data[key].includes(',')) {
                const tags = data[key].split(',').map(t => t.trim()).filter(t => t);
                if (tags.length > 0) {
                    data[key] = tags;
                }
            }
            
            // Legacy native <select multiple> (if any)
            const selectElement = formElement.querySelector(`[name="${key}"][multiple]`);
            if (selectElement) {
                const selected = Array.from(selectElement.selectedOptions).map(opt => opt.value);
                data[key] = selected;
            }

            // Boolean/checkbox (single named checkbox)
            const checkboxElement = formElement.querySelector(`[name="${key}"][type="checkbox"]:not(.occ-ms-option)`);
            if (checkboxElement) {
                data[key] = checkboxElement.checked;
            }
        });

        formElement.querySelectorAll('.occ-ms-field[data-field-key]').forEach(ms => {
            const k = ms.getAttribute('data-field-key');
            if (!k) return;
            data[k] = Array.from(ms.querySelectorAll('.occ-ms-option:checked')).map(c => c.value);
        });

        formElement.querySelectorAll('input.occ-switch-input[type="checkbox"]').forEach(cb => {
            if (cb.name) data[cb.name] = cb.checked;
        });

        return data;
    }
}

// Create singleton instance
const opportunityFormService = new OpportunityFormService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = opportunityFormService;
} else {
    window.opportunityFormService = opportunityFormService;
}
