"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function run(main) {
    main()
        .then()
        .catch((error) => {
        console.log(error);
        process.exit(1);
    });
}
exports.run = run;
