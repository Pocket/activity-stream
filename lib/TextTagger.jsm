/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

this.TextTagger = class TextTagger {
  /**
   * Downcases the text, and splits it into consecutive alphanumeric characters.
   * This is locale aware, and so will not strip accents. This uses "word
   * breaks", and os is not appropriate for languages without them
   * (e.g. Chinese).
   */
  tokenize(text) {
    return text.toLocaleLowerCase().split("(?u)\\b\\w+\\b");
  }

  /**
   * Converts a sequence of tokens into an L2 normed TF-IDF. Any terms that are
   * not preindexed (i.e. does has a computed inverse document frequency) will
   * be dropped.
   */
  tfidf_vector(tokens, vocab_idfs) {
    let tfidfs = {};

    // calcualte the term frequencies
    for (let tok in tokens) {
      if (!(tok in vocab_idfs)) {
        continue;
      }
      if (!(tok in tfidfs)) {
        tfidfs[tok] = 1;
      } else {
        tfidfs[tok]++;
      }
    }

    // now multiply by the log inverse document frequencies, then take
    // the L2 norm of this.
    let l2Norm = 0.0;
    Object.keys(tfidfs).forEach(tok => {
      tfidfs[tok][1] *= vocab_idfs[tok][1];
      l2Norm += tfidfs[tok][1] * tfidfs[tok][1];
    });
    l2Norm = Math.sqrt(l2Norm);
    Object.keys(tfidfs).forEach(tok => {
      tfidfs[tok][1] /= l2Norm;
    });

    return tfidfs;
  }
};

const EXPORTED_SYMBOLS = ["TextTagger"];
