/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {UserDomainAffinityProvider} = ChromeUtils.import("resource://activity-stream/lib/UserDomainAffinityProvider.jsm", {});
const {PersistentCache} = ChromeUtils.import("resource://activity-stream/lib/PersistentCache.jsm", {});
const {RemoteSettings} = ChromeUtils.import("resource://services-settings/remote-settings.js", {});

const {NaiveBayesTextTagger} = ChromeUtils.import("resource://activity-stream/lib/NaiveBayesTextTagger.jsm", {});
const {NmfTextTagger} = ChromeUtils.import("resource://activity-stream/lib/NmfTextTagger.jsm", {});
const {RecipeExecutor} = ChromeUtils.import("resource://activity-stream/lib/RecipeExecutor.jsm", {});

/**
 * V2 provider builds and ranks an interest profile (also called an “interest vector”) off the browse history.
 * This allows Firefox to classify pages into topics, by examining the text found on the page.
 * It does this by looking at the history text content, title, and description.
 */
this.PersonalityProvider = class PersonalityProvider extends UserDomainAffinityProvider {
  // This is just a stub for now, extending UserDomainAffinityProvider until we flesh it out.
  constructor(
    timeSegments,
    parameterSets,
    maxHistoryQueryResults,
    version,
    scores,
    modelKeys = []) {
    super(
      timeSegments,
      parameterSets,
      maxHistoryQueryResults,
      version,
      scores);
    this.modelKeys = modelKeys;
    this.interestVectorStore = new PersistentCache("interest-vector", true);
  }

  getRemoteSettings(name) {
    return RemoteSettings(name);
  }

  getRecipeExecutor(nbTaggers, nmfTaggers) {
    return new RecipeExecutor(nbTaggers, nmfTaggers);
  }

  getNaiveBayesTextTagger(model) {
    return new NaiveBayesTextTagger(model);
  }

  getNmfTextTagger(model) {
    return new NmfTextTagger(model);
  }

  /**
   * Returns a Recipe from remote settings to be consumed by a RecipeExecutor.
   * A Recipe is a set of instructions on how to processes a RecipeExecutor.
   */
  getRecipe() {
    if (!this.recipe) {
      this.recipe = this.getRemoteSettings("personality-provider-recipe");
    }
    return this.recipe;
  }

  /**
   * Returns a Recipe Executor.
   * A Recipe Executor is a set of actions that can be consumed by a Recipe.
   * The Recipe determines the order and specifics of which the actions are called.
   */
  generateRecipeExecutor() {
    let nbTaggers = [];
    let nmfTaggers = {};
    for (let key of this.modelKeys) {
      let model = this.getRemoteSettings(key);
      if (model.model_type === "nb") {
        nbTaggers.push(this.getNaiveBayesTextTagger(model));
      } else if (model.model_type === "nmf") {
        nmfTaggers[model.parent_tag] = this.getNmfTextTagger(model);
      }
    }
    return this.getRecipeExecutor(nbTaggers, nmfTaggers);
  }
};

const EXPORTED_SYMBOLS = ["PersonalityProvider"];
