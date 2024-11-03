"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addImport = void 0;
const js_1 = require("@nx/js");
const ts = require("typescript");
const devkit_1 = require("@nx/devkit");
function addImport(source, statement) {
    const allImports = (0, js_1.findNodes)(source, ts.SyntaxKind.ImportDeclaration);
    if (allImports.length > 0) {
        const lastImport = allImports[allImports.length - 1];
        return [
            {
                type: devkit_1.ChangeType.Insert,
                index: lastImport.end + 1,
                text: `\n${statement}\n`,
            },
        ];
    }
    else {
        return [
            {
                type: devkit_1.ChangeType.Insert,
                index: 0,
                text: `\n${statement}\n`,
            },
        ];
    }
}
exports.addImport = addImport;
//# sourceMappingURL=add-import.js.map