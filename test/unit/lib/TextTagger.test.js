import {GlobalOverrider} from "test/unit/utils";
import {TextTagger} from "lib/TextTagger.jsm";

const EPSILON = 0.00001;

describe("Text Tagger", () => {
  let instance;
  let globals;

  beforeEach(() => {
    globals = new GlobalOverrider();
    instance = new TextTagger();
  });

  afterEach(() => {
    globals.restore();
  });

  describe("#tokenize", () => {
    let testCases = [
      {"input": "HELLO there", "expected": ["hello", "there"]},
      {"input": "blah,,,blah,blah", "expected": ["blah", "blah", "blah"]},
      {"input": "Call Jenny: 967-5809", "expected": ["call", "jenny", "967", "5809"]},
      {"input": "čÄfė 80's", "expected": ["čäfė", "80", "s"]},
      {"input": "我知道很多东西。", "expected": ["我知道很多东西"]}
    ];

    let x = tc => {
      assert.deepEqual(tc.expected, instance.tokenize(tc.input));
    };
    for (let i = 0; i < testCases.length; i++) {
      it("should have the proper tokenization", x(testCases[i]));
    }
  });

  describe("#tfidf", () => {
    let vocab_idfs = {
      "deal":    [221, 5.5058519847862275],
      "easy":    [269, 5.5058519847862275],
      "tanks":   [867, 5.6011621645905520],
      "sites":   [792, 5.9578371085292850],
      "care":    [153, 5.9578371085292850],
      "needs":   [596, 5.8243057159047620],
      "finally": [334, 5.7065226802483790]
    };

    let testCases = [
      {
        "input": "Finally! Easy care for your tanks!",
        "expected": {
          "finally": [334, 0.50098162958537610],
          "easy":    [269, 0.48336453811728713],
          "care":    [153, 0.52304478763682270],
          "tanks":   [867, 0.49173191907236774]
        }
      },
      {
        "input": "Easy easy EASY",
        "expected": {"easy": [269, 1.0]}
      },
      {
        "input": "Easy easy care",
        "expected": {
          "easy": [269, 0.8795205218806832],
          "care": [153, 0.4758609582543317]
        }
      },
      {
        "input": "easy care",
        "expected": {
          "easy": [269, 0.6786999710383944],
          "care": [153, 0.7344156515982504]
        }
      },
      {
        "input": "这个空间故意留空。",
        "expected": { /* This space is left intentionally blank. */ }
      }
    ];

    let checkTokGen = (actualTok, tc) => {
      assert.isTrue(actualTok in tc);
    };
    let checkTokId = (actualTok, actualId, tc) => {
      assert.equal(tc.expected[actualTok][0], actualId);
    };
    let checkTfIdf = (actualTok, actualTfIdf, tc) => {
      let delta = Math.abs(tc.expected[actualTok][1] - actualTfIdf);
      assert.isTrue(delta <= EPSILON);
    };

    for (let i = 0; i < testCases.length; i++) {
      let actual = instance.tfidf_vector(instance.tokenize(testCases[i].input), vocab_idfs);

      // check the computed scores
      let seen = {};
      actual.forEach((actualTok, actualValuePair, m) => {
        it("should expect the token generated", checkTokGen(actualTok, testCases[i]));
        it("should have the same token id", checkTokId(actualTok, actual[actualTok][0], testCases[i]));
        it("should calculate the tf-idf within epsilon of expected", checkTfIdf(actualTok, actual[actualTok][0][1], testCases[i]));
      });

      // make sure we didn"t miss anything
      testCases[i].expected.forEach((expectedTok, expectedValuePair, m) => {
        it("should not generate any extra tokens", () => {
          assert.isTrue(expectedTok in seen);
        });
      });
    }
  });
});
