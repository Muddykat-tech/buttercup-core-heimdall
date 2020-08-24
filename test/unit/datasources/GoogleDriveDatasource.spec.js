const { Credentials, GoogleDriveDatasource } = require("../../../dist/index.node.js");
const { getCredentials } = require("../../../dist/credentials/channel.js");

describe("datasources/GoogleDriveDatasource", function() {
    beforeEach(function() {
        this.credentials = Credentials.fromDatasource(
            {
                type: "googledrive",
                token: "access-token",
                refreshToken: "refresh-token",
                fileID: "file-id"
            },
            "test"
        );
    });

    it("can be instantiated", function() {
        const gdds = new GoogleDriveDatasource(this.credentials);
        expect(gdds)
            .to.have.property("load")
            .that.is.a("function");
        expect(gdds)
            .to.have.property("save")
            .that.is.a("function");
    });

    describe("updateTokens", function() {
        beforeEach(function() {
            this.gdds = new GoogleDriveDatasource(this.credentials);
        });

        it("updates the tokens on the instance credentials", function() {
            this.gdds.updateTokens("new-access", "new-refresh");
            const raw = getCredentials(this.gdds.credentials.id);
            expect(raw.data.datasource.token).to.equal("new-access");
            expect(raw.data.datasource.refreshToken).to.equal("new-refresh");
        });
    });
});
