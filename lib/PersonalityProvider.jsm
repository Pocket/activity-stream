/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {PersistentCache} = ChromeUtils.import("resource://activity-stream/lib/PersistentCache.jsm", {});
const {RemoteSettings} = ChromeUtils.import("resource://services-settings/remote-settings.js", {});

const {NaiveBayesTextTagger} = ChromeUtils.import("resource://activity-stream/lib/NaiveBayesTextTagger.jsm", {});
const {NmfTextTagger} = ChromeUtils.import("resource://activity-stream/lib/NmfTextTagger.jsm", {});
const {RecipeExecutor} = ChromeUtils.import("resource://activity-stream/lib/RecipeExecutor.jsm", {});

ChromeUtils.defineModuleGetter(this, "NewTabUtils",
  "resource://gre/modules/NewTabUtils.jsm");

const STORE_UPDATE_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * V2 provider builds and ranks an interest profile (also called an “interest vector”) off the browse history.
 * This allows Firefox to classify pages into topics, by examining the text found on the page.
 * It does this by looking at the history text content, title, and description.
 */
this.PersonalityProvider = class PersonalityProvider {
  constructor(
    timeSegments,
    parameterSets,
    maxHistoryQueryResults,
    version,
    scores,
    modelKeys) {
    this.modelKeys = modelKeys;
    this.timeSegments = timeSegments;
    this.parameterSets = parameterSets;
    this.maxHistoryQueryResults = maxHistoryQueryResults;
    this.version = version;
    this.scores = scores;
    this.store = new PersistentCache("personality-provider", true);
  }

  profileResults(title, version, time) {
    console.log(" ");
    console.log("========================");
    console.log("PROFILE RESULTS FOR:", title);
    console.log("v:", version);
    console.log("t (in ms):", time);
    console.log("t (in s):", time / 1000);
    console.log("========================");
  }

  async init() {

    let time = 0;
    let start = 0;
    let version = 2;

    start = Date.now();
    this.interestConfig = await this.getRecipe();
    if (!this.interestConfig) {
      return;
    }

    time = Date.now() - start;
    this.profileResults("get recipe", version, time);

    start = Date.now();
    this.recipeExecutor = await this.generateRecipeExecutor();
    console.log(this.recipeExecutor);
    if (!this.recipeExecutor) {
      return;
    }

    time = Date.now() - start;
    this.profileResults("generate recipe executor", version, time);

    //this.interestVector = await this.store.get("interest-vector");

    // Fetch a new one if none exists or every set update time.
    if (!this.interestVector ||
      (Date.now() - this.interestVector.lastUpdate) >= STORE_UPDATE_TIME) {
      start = Date.now();
      this.interestVector = await this.createInterestVector();
      if (!this.interestVector) {
        return;
      }
      this.interestVector.lastUpdate = Date.now();
      this.store.set("interest-vector", this.interestVector);

      time = Date.now() - start;
      this.profileResults("createInterestVector no cache", version, time);
    }
    this.initialized = true;
  }

  async getFromRemoteSettings(name) {
    const result = await RemoteSettings(name).get();
    return result || [];
  }

  /**
   * Returns a Recipe from remote settings to be consumed by a RecipeExecutor.
   * A Recipe is a set of instructions on how to processes a RecipeExecutor.
   */
  async getRecipe() {
    if (!this.recipe) {
      this.recipe = await this.getFromRemoteSettings("personality-provider-recipe");
    }
    return this.recipe[0];
  }

  /**
   * Returns a Recipe Executor.
   * A Recipe Executor is a set of actions that can be consumed by a Recipe.
   * The Recipe determines the order and specifics of which the actions are called.
   */
  async generateRecipeExecutor() {
    let nbTaggers = [];
    let nmfTaggers = {};
    const version = 2;
    let time = 0;
    let start = 0;
    let loopStart = 0;
    let rsStart = 0;
    let cacheStart = 0;
    let profileResults = {
      reTime: 0,
      nbTime: 0,
      nmfTime: 0,
      loopTime: 0,
      rsTime: 0,
      cacheTime: 0,
    };

    cacheStart = Date.now();
    let models = await this.store.get("personality-provider-models");
    //let models;
    time = Date.now() - cacheStart;
    profileResults.cacheTime = time;


    if (!models) {
      rsStart = Date.now();
      models = await this.getFromRemoteSettings("personality-provider-models");
      time = Date.now() - rsStart;
      profileResults.rsTime = time;
      this.store.set("personality-provider-models", models);
    }

    if (models.length === 0) {
      return null;
    }

    loopStart = Date.now();
    for (let model of models) {
      if (!model || !this.modelKeys.includes(model.key)) {
        continue;
      }

      if (model.data.model_type === "nb") {
        start = Date.now();
        nbTaggers.push(new NaiveBayesTextTagger(model.data));
        time = Date.now() - start;
        profileResults.nbTime += time;
      } else if (model.data.model_type === "nmf") {
        start = Date.now();
        nmfTaggers[model.data.parent_tag] = new NmfTextTagger(model.data);
        time = Date.now() - start;
        profileResults.nmfTime += time;
      }
    }
    time = Date.now() - loopStart;
    profileResults.loopTime = time;


    start = Date.now();

    const result = new RecipeExecutor(nbTaggers, nmfTaggers);
    time = Date.now() - start;
    profileResults.reTime = time;

    this.profileResults("nb", version, profileResults.nbTime);
    this.profileResults("nmf", version, profileResults.nmfTime);
    this.profileResults("new RecipeExecutor", version, profileResults.reTime);
    this.profileResults("loop time", version, profileResults.loopTime);
    this.profileResults("getFromRemoteSettings", version, profileResults.rsTime);
    this.profileResults("cache get for personality-provider-models", version, profileResults.cacheTime);
    return result;
  }

  /**
   * Grabs a slice of browse history for building a interest vector
   */
  async fetchHistory(columns, beginTimeSecs, endTimeSecs) {
    let sql = `SELECT url, title, visit_count, frecency, last_visit_date, description
    FROM moz_places
    WHERE last_visit_date >= ${beginTimeSecs * 1000000}
    AND last_visit_date < ${endTimeSecs * 1000000}
    LIMIT 30000`;
    columns.forEach(requiredColumn => {
      sql += ` AND ${requiredColumn} <> ""`;
    });

    const {activityStreamProvider} = NewTabUtils;
    const history = await activityStreamProvider.executePlacesQuery(sql, {
      columns,
      params: {},
    });

    return history;
  }

  /**
   * Examines the user's browse history and returns an interest vector that
   * describes the topics the user frequently browses.
   */
  async createInterestVector() {
    let interestVector = {};
    let endTimeSecs = ((new Date()).getTime() / 1000);
    let beginTimeSecs = endTimeSecs - this.interestConfig.history_limit_secs;
    let history = await this.fetchHistory(this.interestConfig.history_required_fields, beginTimeSecs, endTimeSecs);

    console.log("history length:", history.length);

    for (let historyRec of history) {
      let ivItem = this.recipeExecutor.executeRecipe(historyRec, this.interestConfig.history_item_builder);
      if (ivItem === null) {
        continue;
      }
      interestVector = this.recipeExecutor.executeCombinerRecipe(
        interestVector,
        ivItem,
        this.interestConfig.interest_combiner);
      if (interestVector === null) {
        return null;
      }
    }

    return this.recipeExecutor.executeRecipe(interestVector, this.interestConfig.interest_finalizer);
  }

  /**
   * Calculates a score of a Pocket item when compared to the user's interest
   * vector. Returns the score. Higher scores are better. Assumes this.interestVector
   * is populated.
   */
  calculateItemRelevanceScore(pocketItem) {
    if (!this.initialized) {
      return pocketItem.item_score || 1;
    }
    let scorableItem = this.recipeExecutor.executeRecipe(pocketItem, this.interestConfig.item_to_rank_builder);
    if (scorableItem === null) {
      return -1;
    }

    let rankingVector = JSON.parse(JSON.stringify(this.interestVector));

    Object.keys(scorableItem).forEach(key => {
      rankingVector[key] = scorableItem[key];
    });

    rankingVector = this.recipeExecutor.executeRecipe(rankingVector, this.interestConfig.item_ranker);

    if (rankingVector === null) {
      return -1;
    }
    return rankingVector.score;
  }

  /**
   * Returns an object holding the settings and affinity scores of this provider instance.
   */
  getAffinities() {
    return {
      timeSegments: this.timeSegments,
      parameterSets: this.parameterSets,
      maxHistoryQueryResults: this.maxHistoryQueryResults,
      version: this.version,
      scores: true,
    };
  }
};

const EXPORTED_SYMBOLS = ["PersonalityProvider"];
