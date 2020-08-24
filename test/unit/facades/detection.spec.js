const { isVaultFacade } = require("../../../dist/index.node.js");

describe("facades/detection", function() {
    describe("isVaultFacade", function() {
        it("recognises facade-like objects", function() {
            expect(
                isVaultFacade({
                    type: "vault",
                    id: "1",
                    groups: [],
                    entries: []
                })
            ).to.be.true;
        });

        it("recognises non-facade-like objects", function() {
            expect(
                isVaultFacade({
                    type: "vault",
                    groups: [],
                    entries: []
                })
            ).to.be.false;
            expect(isVaultFacade({})).to.be.false;
            expect(isVaultFacade()).to.be.false;
            expect(isVaultFacade(null)).to.be.false;
        });
    });
});
