import {GlobalOverrider} from "test/unit/utils";
import {PersonalityProvider} from "lib/PersonalityProvider.jsm";

const TIME_SEGMENTS = [
  {"id": "hour", "startTime": 3600, "endTime": 0, "weightPosition": 1},
  {"id": "day", "startTime": 86400, "endTime": 3600, "weightPosition": 0.75},
  {"id": "week", "startTime": 604800, "endTime": 86400, "weightPosition": 0.5},
  {"id": "weekPlus", "startTime": null, "endTime": 604800, "weightPosition": 0.25}
];

const PARAMETER_SETS = {
  "paramSet1": {
    "recencyFactor": 0.5,
    "frequencyFactor": 0.5,
    "combinedDomainFactor": 0.5,
    "perfectFrequencyVisits": 10,
    "perfectCombinedDomainScore": 2,
    "multiDomainBoost": 0.1,
    "itemScoreFactor": 0
  },
  "paramSet2": {
    "recencyFactor": 1,
    "frequencyFactor": 0.7,
    "combinedDomainFactor": 0.8,
    "perfectFrequencyVisits": 10,
    "perfectCombinedDomainScore": 2,
    "multiDomainBoost": 0.1,
    "itemScoreFactor": 0
  }
};

describe("Personality Provider", () => {
  let instance;
  let globals;

  beforeEach(() => {
    globals = new GlobalOverrider();

    const testUrl = "www.somedomain.com";
    globals.sandbox.stub(global.Services.io, "newURI").returns({host: testUrl});

    globals.sandbox.stub(global.PlacesUtils.history, "executeQuery").returns({root: {childCount: 1, getChild: index => ({uri: testUrl, accessCount: 1})}});
    globals.sandbox.stub(global.PlacesUtils.history, "getNewQuery").returns({"TIME_RELATIVE_NOW": 1});
    globals.sandbox.stub(global.PlacesUtils.history, "getNewQueryOptions").returns({});

    instance = new PersonalityProvider(TIME_SEGMENTS, PARAMETER_SETS);
  });
  afterEach(() => {
    globals.restore();
  });
  describe("#interestVector", () => {
    it("should have an interestVectorStore", () => {
      assert.equal(instance.interestVectorStore.name, "interest-vector");
      // The is to make sure prelaod is set to true.
      assert.equal(!!instance.interestVectorStore._cache, true);
    });
  });
  describe("#models", () => {
    it("should call getModel when using nb and nmf getters", () => {
      // This is a bit of a hack to trigger a getter,
      // while also passing lint and not storing the result.
      function triggerGetter(getter) {
        return getter;
      }
      sinon.stub(instance, "getModel");
      triggerGetter(instance.nbModel);

      assert.calledOnce(instance.getModel);
      assert.calledWith(instance.getModel, "nb");
      triggerGetter(instance.nmfModel);

      assert.calledTwice(instance.getModel);
      assert.calledWith(instance.getModel, "nmf");
    });
    it("should return expected results from getModel", () => {
      try {
        instance.getModel("nothing");
      } catch (e) {
        assert.equal(e.message, "Personality provider received unexpected model: nothing");
      }

      assert.equal(!instance._nmfModel, true);
      assert.equal(!instance._nbModel, true);

      assert.equal(!!instance.getModel("nmf").get, true);
      assert.equal(!!instance.getModel("nb").get, true);

      assert.equal(!!instance._nmfModel, true);
      assert.equal(!!instance._nbModel, true);
    });
  });
});
