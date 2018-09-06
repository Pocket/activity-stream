import {GlobalOverrider} from "test/unit/utils";
import injector from "inject!lib/PersonalityProvider.jsm";

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
  let PersonalityProvider;
  let globals;
  let NaiveBayesTextTaggerStub;
  let NmfTextTaggerStub;
  let TfIdfVectorizerStub;
  let RecipeExecutorStub;

  beforeEach(() => {
    globals = new GlobalOverrider();

    const testUrl = "www.somedomain.com";
    globals.sandbox.stub(global.Services.io, "newURI").returns({host: testUrl});

    globals.sandbox.stub(global.PlacesUtils.history, "executeQuery").returns({root: {childCount: 1, getChild: index => ({uri: testUrl, accessCount: 1})}});
    globals.sandbox.stub(global.PlacesUtils.history, "getNewQuery").returns({"TIME_RELATIVE_NOW": 1});
    globals.sandbox.stub(global.PlacesUtils.history, "getNewQueryOptions").returns({});

    NaiveBayesTextTaggerStub = globals.sandbox.stub();
    NmfTextTaggerStub = globals.sandbox.stub();
    TfIdfVectorizerStub = globals.sandbox.stub();
    RecipeExecutorStub = globals.sandbox.stub();

    ({PersonalityProvider} = injector({
      "lib/NaiveBayesTextTagger.jsm": {NaiveBayesTextTagger: NaiveBayesTextTaggerStub},
      "lib/NmfTextTagger.jsm": {NmfTextTagger: NmfTextTaggerStub},
      "lib/TfIdfVectorizer.jsm": {TfIdfVectorizer: TfIdfVectorizerStub},
      "lib/RecipeExecutor.jsm": {RecipeExecutor: RecipeExecutorStub}
    }));

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
  describe("#remote-settings", () => {
    it("should return a remote setting for getRemoteSettings", () => {
      assert.equal(typeof instance.getRemoteSettings("test"), "object");
    });
  });
  describe("#taggers", () => {
    it("should return a NaiveBayesTextTagger on getNaiveBayesTextTagger", () => {
      instance.getNaiveBayesTextTagger({});
      assert.calledOnce(NaiveBayesTextTaggerStub);
    });
    it("should return a NmfTextTagger on getNmfTextTagger", () => {
      instance.getNmfTextTagger({});
      assert.calledOnce(NmfTextTaggerStub);
    });
  });
  describe("#executor", () => {
    it("should return a RecipeExecutor on getRecipeExecutor", () => {
      instance.getRecipeExecutor([], []);
      assert.calledOnce(RecipeExecutorStub);
    });
    it("should return a recipeExecutor with generateRecipeExecutor", () => {
      instance.modelKeys = ["nbSports", "nmfSports"];
      instance.getRecipeExecutor = (nbTaggers, nmfTaggers) => ({nbTaggers, nmfTaggers});

      instance.getRemoteSettings = name => {
        let returnVal = {};
        if (name === "nbSports") {
          returnVal = {model_type: "nb"};
        } else if (name === "nmfSports") {
          returnVal = {model_type: "nmf", parent_tag: "parent_tag"};
        }
        return returnVal;
      };
      instance.getNaiveBayesTextTagger = model => model;
      instance.getNmfTextTagger = model => model;
      const recipeExecutor = instance.generateRecipeExecutor();
      assert.equal(recipeExecutor.nbTaggers[0].model_type, "nb");
      assert.equal(recipeExecutor.nmfTaggers.parent_tag.model_type, "nmf");
    });
  });
  describe("#recipe", () => {
    it("should get and fetch a new recipe on first getRecipe", () => {
      sinon.stub(instance, "getRemoteSettings");
      instance.getRecipe();
      assert.calledOnce(instance.getRemoteSettings);
      assert.calledWith(instance.getRemoteSettings, "personality-provider-recipe");
    });
    it("should not fetch a recipe on getRecipe if cached", () => {
      sinon.stub(instance, "getRemoteSettings");
      instance.recipe = {};
      instance.getRecipe();
      assert.notCalled(instance.getRemoteSettings);
    });
  });
});
