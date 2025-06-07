module.exports = {

"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/formidable [external] (formidable, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("formidable");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/@google-cloud/vision [external] (@google-cloud/vision, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@google-cloud/vision", () => require("@google-cloud/vision"));

module.exports = mod;
}}),
"[externals]/path [external] (path, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}}),
"[project]/src/lib/visionClient.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// src/lib/visionClient.ts
// Dùng API Cloud Vision API để xữ lý Scan ID / CCCD...
__turbopack_context__.s({
    "visionClient": (()=>visionClient)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2d$cloud$2f$vision__$5b$external$5d$__$2840$google$2d$cloud$2f$vision$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@google-cloud/vision [external] (@google-cloud/vision, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const visionClient = new __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2d$cloud$2f$vision__$5b$external$5d$__$2840$google$2d$cloud$2f$vision$2c$__cjs$29$__["default"].ImageAnnotatorClient({
    keyFilename: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'ocrServiceKey.json')
});
}}),
"[project]/src/lib/ocr/extractInfo.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "extractInfoFromRawText": (()=>extractInfoFromRawText)
});
function extractInfoFromRawText(text) {
    if (!text || typeof text !== 'string') {
        return {
            name: '',
            idNumber: '',
            address: '',
            sex: '',
            nationality: '',
            placeOfOrigin: '',
            placeOfResidence: '',
            dateOfBirth: ''
        };
    }
    const lines = text.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
    let name = '', idNumber = '', dateOfBirth = '', sex = '', nationality = '', placeOfOrigin = '', placeOfResidence = '', address = '';
    for(let i = 0; i < lines.length; i++){
        const line = lines[i];
        // 🔍 ID Number (KHÔNG ĐỘNG VÀO – ĐANG ĐÚNG)
        if (/S[ốóô]?[\s\/:-]*No\.?[:\s]*\d{6,15}/i.test(line)) {
            const match = line.match(/\d{9,15}/);
            if (match) idNumber = match[0];
        }
        // 🔍 Name
        if (/Họ và tên|Full name/i.test(line)) {
            const idx = line.indexOf(':');
            if (idx !== -1) {
                const inlineName = line.substring(idx + 1).trim();
                if (inlineName.length > 3) name = inlineName;
            }
            if (!name && lines[i + 1]) {
                name = lines[i + 1].trim();
                if (lines[i + 2] && lines[i + 2].split(' ').length <= 3) {
                    name += ' ' + lines[i + 2].trim();
                }
            }
        }
        // ✅ FIXED – Date of Birth: hỗ trợ nhiều định dạng OCR sai
        if (/Ngày sinh|Date of birth/i.test(line)) {
            const dobMatch = line.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/);
            if (dobMatch) {
                dateOfBirth = dobMatch[0];
            } else {
                // Một số OCR bị lỗi format số → fallback tìm các số gần dòng đó
                const nextLine = lines[i + 1] || '';
                const fallbackMatch = nextLine.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/);
                if (fallbackMatch) dateOfBirth = fallbackMatch[0];
            }
        }
        // ✅ FIXED – Sex & Nationality on same line
        if (/Giới tính|Sex/i.test(line) && /Quốc tịch|Nationality/i.test(line)) {
            const sexMatch = line.match(/(?:Giới tính|Sex)\s*[:\-]?\s*([A-Za-zÀ-ỹ]+)/i);
            const nationMatch = line.match(/(?:Quốc tịch|Nationality)\s*[:\-]?\s*([A-Za-zÀ-ỹ\s]+)/i);
            if (sexMatch) {
                const rawSex = sexMatch[1].toLowerCase();
                if ([
                    'nam',
                    'nữ',
                    'male',
                    'female'
                ].includes(rawSex)) {
                    sex = capitalizeFirst(rawSex);
                }
            }
            if (nationMatch) {
                nationality = nationMatch[1].trim();
            }
        } else {
            // ✅ fallback – Sex riêng
            if (/Giới tính|Sex/i.test(line)) {
                const match = line.match(/(?:Giới tính|Sex)\s*[:\-]?\s*([A-Za-zÀ-ỹ]+)/i);
                if (match) {
                    const raw = match[1].toLowerCase();
                    if ([
                        'nam',
                        'nữ',
                        'male',
                        'female'
                    ].includes(raw)) {
                        sex = capitalizeFirst(raw);
                    }
                }
            }
            // FIXED – Nationality with fallback to next line
            if (/Quốc tịch|Nationality/i.test(line)) {
                let current = line.replace(/^I\s+/i, '').trim(); // remove 'I ' if any
                // Trường hợp dòng chỉ chứa từ khóa: "Nationality" hoặc "Quốc tịch"
                if (/^Nationality$|^Quốc tịch$/i.test(current)) {
                    const nextLine = lines[i + 1] || '';
                    nationality = nextLine.trim();
                } else {
                    const match = current.match(/(?:Quốc tịch|Nationality)\s*[:\-]?\s*([A-Za-zÀ-ỹ\s]+)/i);
                    if (match) {
                        nationality = match[1].trim();
                    }
                }
            }
        }
        // 🔍 Place of Origin
        if (/Quê quán|Place of origin/i.test(line)) {
            let originValue = '';
            const idx = line.indexOf(':');
            if (idx !== -1) originValue = line.substring(idx + 1).trim();
            i++;
            while(i < lines.length && !/^(Họ và tên|Full name|Ngày sinh|Date of birth|Giới tính|Sex|Quốc tịch|Nationality|Nơi thường trú|Place of residence|Số|No\.|Ngày cấp|Date of issue|Có giá trị đến|Date of expiry)/i.test(lines[i])){
                originValue += ' ' + lines[i].trim();
                i++;
            }
            placeOfOrigin = originValue.replace(/,$/, '').trim();
            i--;
        }
        // 🔍 Place of Residence
        if (/Nơi thường trú|Place of residence/i.test(line)) {
            let residenceValue = '';
            const idx = line.indexOf(':');
            if (idx !== -1) residenceValue = line.substring(idx + 1).trim();
            i++;
            while(i < lines.length && !/^(Họ và tên|Full name|Ngày sinh|Date of birth|Giới tính|Sex|Quốc tịch|Nationality|Quê quán|Place of origin|Số|No\.|Ngày cấp|Date of issue|Có giá trị đến|Date of expiry)/i.test(lines[i])){
                residenceValue += ' ' + lines[i].trim();
                i++;
            }
            placeOfResidence = residenceValue.replace(/,$/, '').trim();
            address = placeOfResidence;
            i--;
        }
    }
    console.log('[✅ Extracted Result]', {
        name,
        idNumber,
        address,
        sex,
        nationality,
        placeOfOrigin,
        placeOfResidence,
        dateOfBirth
    });
    return {
        name: name || '',
        idNumber: idNumber || '',
        address: address || '',
        sex: sex || '',
        nationality: nationality || '',
        placeOfOrigin: placeOfOrigin || '',
        placeOfResidence: placeOfResidence || '',
        dateOfBirth: dateOfBirth || ''
    };
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
}}),
"[project]/pages/api/ocr.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
// ✅ Xử lý trích xuất thông tin từ CCCD/CMND bằng Google Vision API
__turbopack_context__.s({
    "config": (()=>config),
    "default": (()=>handler)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$formidable__$5b$external$5d$__$28$formidable$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/formidable [external] (formidable, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$visionClient$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/visionClient.ts [api] (ecmascript)"); // 🔐 client dùng key riêng
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ocr$2f$extractInfo$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/ocr/extractInfo.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$formidable__$5b$external$5d$__$28$formidable$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f$formidable__$5b$external$5d$__$28$formidable$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
const config = {
    api: {
        bodyParser: false
    }
};
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }
    const form = new __TURBOPACK__imported__module__$5b$externals$5d2f$formidable__$5b$external$5d$__$28$formidable$2c$__esm_import$29$__["IncomingForm"]({
        keepExtensions: true
    });
    form.parse(req, async (err, fields, files)=>{
        if (err) {
            console.error('❌ Form parsing error:', err);
            return res.status(500).json({
                error: 'Failed to parse form data'
            });
        }
        const rawFile = files.file;
        const uploadedFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;
        if (!uploadedFile || !uploadedFile.filepath) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }
        try {
            // ✅ OCR với Google Vision API
            const [result] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$visionClient$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["visionClient"].textDetection(uploadedFile.filepath);
            const detections = result.textAnnotations;
            const rawText = detections?.[0]?.description || '';
            if (!rawText.trim()) {
                return res.status(200).json({
                    error: 'No text detected in the image.'
                });
            }
            const extracted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ocr$2f$extractInfo$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["extractInfoFromRawText"])(rawText);
            return res.status(200).json({
                ...extracted,
                rawText
            });
        } catch (error) {
            console.error('❌ OCR error:', error);
            return res.status(500).json({
                error: 'Error during OCR processing',
                message: error?.message || 'Unknown error'
            });
        } finally{
            // ✅ Dọn file tạm
            if (uploadedFile?.filepath && __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(uploadedFile.filepath)) {
                __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].unlinkSync(uploadedFile.filepath);
            }
        }
    });
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/node_modules/next/dist/esm/server/route-modules/pages-api/module.compiled.js [api] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    if ("TURBOPACK compile-time truthy", 1) {
        if ("TURBOPACK compile-time truthy", 1) {
            module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)");
        } else {
            "TURBOPACK unreachable";
        }
    } else {
        "TURBOPACK unreachable";
    }
} //# sourceMappingURL=module.compiled.js.map
}}),
"[project]/node_modules/next/dist/esm/server/route-kind.js [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "RouteKind": (()=>RouteKind)
});
var RouteKind = /*#__PURE__*/ function(RouteKind) {
    /**
   * `PAGES` represents all the React pages that are under `pages/`.
   */ RouteKind["PAGES"] = "PAGES";
    /**
   * `PAGES_API` represents all the API routes under `pages/api/`.
   */ RouteKind["PAGES_API"] = "PAGES_API";
    /**
   * `APP_PAGE` represents all the React pages that are under `app/` with the
   * filename of `page.{j,t}s{,x}`.
   */ RouteKind["APP_PAGE"] = "APP_PAGE";
    /**
   * `APP_ROUTE` represents all the API routes and metadata routes that are under `app/` with the
   * filename of `route.{j,t}s{,x}`.
   */ RouteKind["APP_ROUTE"] = "APP_ROUTE";
    /**
   * `IMAGE` represents all the images that are generated by `next/image`.
   */ RouteKind["IMAGE"] = "IMAGE";
    return RouteKind;
}({}); //# sourceMappingURL=route-kind.js.map
}}),
"[project]/node_modules/next/dist/esm/build/templates/helpers.js [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Hoists a name from a module or promised module.
 *
 * @param module the module to hoist the name from
 * @param name the name to hoist
 * @returns the value on the module (or promised module)
 */ __turbopack_context__.s({
    "hoist": (()=>hoist)
});
function hoist(module, name) {
    // If the name is available in the module, return it.
    if (name in module) {
        return module[name];
    }
    // If a property called `then` exists, assume it's a promise and
    // return a promise that resolves to the name.
    if ('then' in module && typeof module.then === 'function') {
        return module.then((mod)=>hoist(mod, name));
    }
    // If we're trying to hoise the default export, and the module is a function,
    // return the module itself.
    if (typeof module === 'function' && name === 'default') {
        return module;
    }
    // Otherwise, return undefined.
    return undefined;
} //# sourceMappingURL=helpers.js.map
}}),
"[project]/node_modules/next/dist/esm/build/templates/pages-api.js { INNER_PAGE => \"[project]/pages/api/ocr.ts [api] (ecmascript)\" } [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "config": (()=>config),
    "default": (()=>__TURBOPACK__default__export__),
    "routeModule": (()=>routeModule)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$pages$2d$api$2f$module$2e$compiled$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/route-modules/pages-api/module.compiled.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/route-kind.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$helpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/build/templates/helpers.js [api] (ecmascript)");
// Import the userland code.
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$ocr$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pages/api/ocr.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$ocr$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$ocr$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$helpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["hoist"])(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$ocr$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, 'default');
const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$helpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["hoist"])(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$ocr$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, 'config');
const routeModule = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$pages$2d$api$2f$module$2e$compiled$2e$js__$5b$api$5d$__$28$ecmascript$29$__["PagesAPIRouteModule"]({
    definition: {
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$api$5d$__$28$ecmascript$29$__["RouteKind"].PAGES_API,
        page: "/api/ocr",
        pathname: "/api/ocr",
        // The following aren't used in production.
        bundlePath: '',
        filename: ''
    },
    userland: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$ocr$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
}); //# sourceMappingURL=pages-api.js.map
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__e8cfe8f6._.js.map