/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {UserDomainAffinityProvider} = ChromeUtils.import("resource://activity-stream/lib/UserDomainAffinityProvider.jsm", {});
const {PersistentCache} = ChromeUtils.import("resource://activity-stream/lib/PersistentCache.jsm", {});
const {RemoteSettings} = ChromeUtils.import("resource://services-settings/remote-settings.js", {});

/**
 *
 */
this.PersonalityProvider = class PersonalityProvider extends UserDomainAffinityProvider {
  // This is just a stub for now, extending UserDomainAffinityProvider until we flesh it out.
  constructor(...args) {
    super(...args);
    this.interestVectorStore = new PersistentCache("interest-vector", true);
  }

  /**
   * Get the nb or nmf collection from Remote Settings.
   */
  getModel(modelType) {
    if (modelType !== "nb" && modelType !== "nmf") {
      throw new Error(`Personality provider received unexpected model: ${modelType}`);
    }

    // Do we need to clear this at some point in case we have updates?
    if (!this[`_${modelType}Model`]) {
      this[`_${modelType}Model`] = RemoteSettings(`${modelType}-model`);
    }
    return this[`_${modelType}Model`];
  }

  get nbModel() {
    return this.getModel("nb");
  }

  get nmfModel() {
    return this.getModel("nmf");
  }
};

const EXPORTED_SYMBOLS = ["PersonalityProvider"];
