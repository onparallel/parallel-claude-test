"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
function run(main) {
    main()
        .then()
        .catch((error) => {
        console.log(error);
        process.exit(1);
    });
}
exports.run = run;
