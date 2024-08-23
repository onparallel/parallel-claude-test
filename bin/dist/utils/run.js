"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
function run(main) {
    main()
        .then()
        .catch((error) => {
        console.log(error);
        process.exit(1);
    });
}
