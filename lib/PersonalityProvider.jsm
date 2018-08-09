/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {UserDomainAffinityProvider} = ChromeUtils.import("resource://activity-stream/lib/UserDomainAffinityProvider.jsm", {});

// This is just a stub for now.
this.PersonalityProvider = UserDomainAffinityProvider;

const EXPORTED_SYMBOLS = ["PersonalityProvider"];
