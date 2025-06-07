module.exports = {

"[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Button": (()=>Button)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
const Button = ({ className = '', children, onClick, type = 'button', variant = 'default', disabled = false })=>{
    const baseClass = 'inline-flex items-center justify-center px-4 py-2 font-semibold rounded-md transition-all text-sm';
    const variantClass = {
        default: 'bg-[#00d289] text-white border border-[#00d289] hover:bg-[#00b67a]',
        ghost: 'bg-transparent text-[#00d289] border border-transparent hover:bg-[#e6fff5]',
        outline: 'bg-white text-[#00d289] border border-[#00d289] hover:bg-[#f0fdf8]',
        secondary: 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200',
        danger: 'bg-red-500 text-white border border-red-500 hover:bg-red-600',
        greenOutline: 'bg-transparent text-[#00d289] border border-[#00d289] hover:bg-[#00d289]/10',
        destructive: 'bg-white text-red-600 border border-red-500 hover:bg-red-50'
    };
    const disabledClass = disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : '';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: type,
        disabled: disabled,
        className: `${baseClass} ${variantClass[variant]} ${disabledClass} ${className}`,
        onClick: onClick,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
};
}}),
"[project]/src/lib/formConfigurations/formConfigurationTypes.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "defaultFormConfiguration": (()=>defaultFormConfiguration)
});
const defaultFormConfiguration = {
    companyId: '',
    createdBy: '',
    sections: [
        {
            id: 'customer_information',
            title: '1. CUSTOMER INFORMATION',
            fields: [
                {
                    key: 'idImage',
                    label: 'Upload ID',
                    type: 'upload',
                    required: false,
                    visible: true
                },
                {
                    key: 'fullName',
                    label: 'Full Name',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'phone',
                    label: 'Phone Number',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'idNumber',
                    label: 'ID Number',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'address',
                    label: 'Address',
                    type: 'text',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'vehicle_information',
            title: '2. VEHICLE INFORMATION',
            fields: [
                {
                    key: 'vehicleSearch',
                    label: 'Enter part of Vehicle ID',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'vehicleModel',
                    label: 'Vehicle Model',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'vehicleColor',
                    label: 'Vehicle Color',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'vin',
                    label: 'VIN',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'licensePlate',
                    label: 'License Plate (optional)',
                    type: 'text',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'battery_information',
            title: '3. BATTERY INFORMATION',
            fields: [
                {
                    key: 'batteryCode1',
                    label: 'Battery Code 1',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'batteryCode2',
                    label: 'Battery Code 2',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'batteryCode3',
                    label: 'Battery Code 3',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'batteryCode4',
                    label: 'Battery Code 4',
                    type: 'text',
                    required: false,
                    visible: true
                }
            ]
        }
    ]
};
}}),
"[project]/src/lib/services/Configirations/formConfigurationService.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getFormConfigurationByCompanyId": (()=>getFormConfigurationByCompanyId),
    "saveFormConfiguration": (()=>saveFormConfiguration)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$formConfigurations$2f$formConfigurationTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/formConfigurations/formConfigurationTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.node.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebaseConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/firebaseConfig.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebaseConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/firebaseConfig.ts [app-ssr] (ecmascript) <locals>");
;
;
;
const getFormConfigurationByCompanyId = async (companyId)=>{
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebaseConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"], 'formConfigurations', companyId);
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (snapshot.exists()) {
        return {
            id: snapshot.id,
            ...snapshot.data()
        };
    } else {
        return {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$formConfigurations$2f$formConfigurationTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultFormConfiguration"],
            companyId
        };
    }
};
const saveFormConfiguration = async (config)=>{
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebaseConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"], 'formConfigurations', config.companyId);
    const dataToSave = {
        ...config,
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    };
    if (config.id) {
        // Cập nhật (update)
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, dataToSave);
    } else {
        // Tạo mới
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setDoc"])(docRef, {
            ...dataToSave,
            createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
        });
    }
};
}}),
"[project]/src/lib/formConfigurations/predefinedFormTemplates.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "predefinedFormTemplates": (()=>predefinedFormTemplates)
});
const predefinedFormTemplates = {
    companyId: '',
    createdBy: '',
    sections: [
        {
            id: 'customer_information',
            title: '1. CUSTOMER INFORMATION',
            fields: [
                {
                    key: 'idImage',
                    label: 'Upload ID',
                    type: 'upload',
                    required: false,
                    visible: true
                },
                {
                    key: 'fullName',
                    label: 'Full Name',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'phone',
                    label: 'Phone Number',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'idNumber',
                    label: 'ID Number',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'address',
                    label: 'Address',
                    type: 'text',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'vehicle_information',
            title: '2. VEHICLE INFORMATION',
            fields: [
                {
                    key: 'vehicleSearch',
                    label: 'Enter part of Vehicle ID',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'vehicleModel',
                    label: 'Vehicle Model',
                    type: 'text',
                    required: true,
                    visible: true
                },
                {
                    key: 'vehicleColor',
                    label: 'Vehicle Color',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'vin',
                    label: 'VIN',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'licensePlate',
                    label: 'License Plate (optional)',
                    type: 'text',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'battery_information',
            title: '3. BATTERY INFORMATION',
            fields: [
                {
                    key: 'batteryCode',
                    label: 'Battery Code',
                    type: 'text',
                    required: false,
                    visible: true
                },
                {
                    key: 'batteryLevel',
                    label: 'Battery Level (%)',
                    type: 'number',
                    required: false,
                    visible: true
                },
                {
                    key: 'chargingMethod',
                    label: 'Charging Method',
                    type: 'select',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'pricing_deposit',
            title: '4. PRICING & DEPOSIT',
            fields: [
                {
                    key: 'package',
                    label: 'Rental Package',
                    type: 'select',
                    required: true,
                    visible: true
                },
                {
                    key: 'basePrice',
                    label: 'Base Price (VND)',
                    type: 'number',
                    required: false,
                    visible: true
                },
                {
                    key: 'batteryFee',
                    label: 'Battery Rental Fee',
                    type: 'number',
                    required: false,
                    visible: true
                },
                {
                    key: 'totalAmount',
                    label: 'Total Amount',
                    type: 'number',
                    required: false,
                    visible: true
                },
                {
                    key: 'deposit',
                    label: 'Deposit',
                    type: 'number',
                    required: false,
                    visible: true
                },
                {
                    key: 'remainingBalance',
                    label: 'Remaining Balance',
                    type: 'number',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'accessories_info',
            title: '5. ACCESSORIES INFO',
            fields: [
                {
                    key: 'helmet',
                    label: 'Helmet Included',
                    type: 'checkbox',
                    required: false,
                    visible: true
                },
                {
                    key: 'charger',
                    label: 'Charger Included',
                    type: 'checkbox',
                    required: false,
                    visible: true
                }
            ]
        },
        {
            id: 'notes',
            title: '6. NOTES',
            fields: [
                {
                    key: 'note',
                    label: 'Additional Notes',
                    type: 'textarea',
                    required: false,
                    visible: true
                },
                {
                    key: 'captureBill',
                    label: 'Capture Bill',
                    type: 'upload',
                    required: false,
                    visible: true
                }
            ]
        }
    ]
};
}}),
"[project]/src/components/ui/checkbox.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Checkbox": (()=>Checkbox)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
const Checkbox = ({ checked, onCheckedChange, className = '', disabled = false })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: "checkbox",
        className: `w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-[#00d289] ${className}`,
        checked: checked,
        onChange: (e)=>onCheckedChange(e.target.checked),
        disabled: disabled
    }, void 0, false, {
        fileName: "[project]/src/components/ui/checkbox.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
};
}}),
"[project]/app/my-business/form-builder/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>FormBuilder)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$Configirations$2f$formConfigurationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/Configirations/formConfigurationService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$formConfigurations$2f$predefinedFormTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/formConfigurations/predefinedFormTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/checkbox.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function FormBuilder({ companyId, userId }) {
    const [selectedSections, setSelectedSections] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchConfig = async ()=>{
            try {
                const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$Configirations$2f$formConfigurationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFormConfigurationByCompanyId"])(companyId);
                if (config?.selectedSections) {
                    setSelectedSections(config.selectedSections);
                }
            } catch (error) {
                console.error('❌ Failed to load form config:', error);
            } finally{
                setLoading(false);
            }
        };
        fetchConfig();
    }, [
        companyId
    ]);
    const toggleField = (sectionId, fieldKey)=>{
        setSelectedSections((prev)=>{
            const section = prev.find((s)=>s.sectionId === sectionId);
            if (!section) {
                return [
                    ...prev,
                    {
                        sectionId,
                        enabledFields: [
                            fieldKey
                        ]
                    }
                ];
            }
            const isEnabled = section.enabledFields.includes(fieldKey);
            const updatedFields = isEnabled ? section.enabledFields.filter((f)=>f !== fieldKey) : [
                ...section.enabledFields,
                fieldKey
            ];
            return prev.map((s)=>s.sectionId === sectionId ? {
                    ...s,
                    enabledFields: updatedFields
                } : s);
        });
    };
    const isFieldEnabled = (sectionId, fieldKey)=>{
        const section = selectedSections.find((s)=>s.sectionId === sectionId);
        return section?.enabledFields.includes(fieldKey);
    };
    const save = async ()=>{
        setSaving(true);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$Configirations$2f$formConfigurationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveFormConfiguration"])({
                companyId,
                createdBy: userId,
                selectedSections,
                updatedAt: new Date()
            });
        } catch (err) {
            console.error('❌ Failed to save config:', err);
        } finally{
            setSaving(false);
        }
    };
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Loading form template..."
    }, void 0, false, {
        fileName: "[project]/app/my-business/form-builder/page.tsx",
        lineNumber: 87,
        columnNumber: 23
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6 p-6 max-w-5xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-semibold mb-4",
                children: "🧩 Select Form Sections & Fields"
            }, void 0, false, {
                fileName: "[project]/app/my-business/form-builder/page.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$formConfigurations$2f$predefinedFormTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["predefinedFormTemplates"].map((section)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border rounded-lg p-4 shadow-sm bg-white",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "font-semibold text-lg mb-2",
                            children: section.title
                        }, void 0, false, {
                            fileName: "[project]/app/my-business/form-builder/page.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 gap-2",
                            children: section.fields.map((field)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Checkbox"], {
                                            checked: isFieldEnabled(section.id, field.key),
                                            onCheckedChange: ()=>toggleField(section.id, field.key)
                                        }, void 0, false, {
                                            fileName: "[project]/app/my-business/form-builder/page.tsx",
                                            lineNumber: 99,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: field.label
                                        }, void 0, false, {
                                            fileName: "[project]/app/my-business/form-builder/page.tsx",
                                            lineNumber: 103,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, field.key, true, {
                                    fileName: "[project]/app/my-business/form-builder/page.tsx",
                                    lineNumber: 98,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/my-business/form-builder/page.tsx",
                            lineNumber: 96,
                            columnNumber: 11
                        }, this)
                    ]
                }, section.id, true, {
                    fileName: "[project]/app/my-business/form-builder/page.tsx",
                    lineNumber: 94,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-4 flex gap-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                    onClick: save,
                    disabled: saving,
                    children: [
                        "💾 ",
                        saving ? 'Saving...' : 'Save Configuration'
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/my-business/form-builder/page.tsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/my-business/form-builder/page.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/my-business/form-builder/page.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=_a3421159._.js.map