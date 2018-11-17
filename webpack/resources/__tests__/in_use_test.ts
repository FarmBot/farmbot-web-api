import { TaggedSequence } from "farmbot";
import { ResourceIndex } from "../interfaces";
import { buildResourceIndex } from "../../__test_support__/resource_index_builder";
import { EVERY_USAGE_KIND, UsageIndex, resourceUsageList } from "../in_use";
import { DeepPartial } from "redux";
import { fakeSequence } from "../../__test_support__/fake_state/resources";

describe("resourceUsageList", () => {
  it("Converts `UsageIndex` type Into Record<UUID, boolean>", () => {
    const x = {
      "FarmEvent.Regimen": {
        "FarmEvent.0.0": { "Regimen.2.2": true, "Regimen.1.1": true }
      },
      "FarmEvent.Sequence": {
        "FarmEvent.3.3": { "Sequence.4.4": true, "Sequence.5.5": true }
      },
      "Regimen.Sequence": {
        "Regimen.6.6": { "Sequence.7.7": true, "Sequence.8.8": true }
      },
      "Sequence.Sequence": {
        "Regimen.9.9": { "Sequence.10.10": true, "Sequence.11.11": true }
      },
    };
    const actual = Object.keys(resourceUsageList(x)).sort();
    const expected =
      ["FarmEvent.0.0", "FarmEvent.3.3", "Regimen.6.6", "Regimen.9.9"].sort();
    expect(actual.length).toEqual(expected.length);
    expected.map(y => expect(actual).toContain(y));
  });
});
describe("in_use tracking at reducer level", () => {
  function testCase(sequences: TaggedSequence[]): ResourceIndex {
    return buildResourceIndex(sequences).index;
  }

  const assertShape =
    (inUse: UsageIndex, expected: DeepPartial<UsageIndex>) => {
      EVERY_USAGE_KIND.map(kind => expect(inUse[kind]).toEqual(expected[kind] || {}));
    };

  it("loads defaults", () => assertShape(testCase([]).inUse, {}));

  it("does not track self-referencing Sequences", () => {
    const selfReferential = fakeSequence();
    const sequence_id = selfReferential.body.id;
    if (sequence_id) {
      selfReferential.body.body = [{ kind: "execute", args: { sequence_id } }];
      const { inUse } = testCase([selfReferential]);
      assertShape(inUse, {});
    } else {
      fail("Need an ID for this one.");
    }
  });

  it("handles a sequence that calls many sequences", () => {
    const s1 = fakeSequence();
    const s2 = fakeSequence();
    const s3 = fakeSequence();
    if (s1.body.id && s2.body.id) {
      s1.body.body = [
        { kind: "execute", args: { sequence_id: s3.body.id || -0 } },
        { kind: "execute", args: { sequence_id: s2.body.id || -0 } },
      ];
      const { inUse } = testCase([s1]);
      assertShape(inUse, {
        "Sequence.Sequence": {
          [s2.uuid]: { [s1.uuid]: true },
          [s3.uuid]: { [s1.uuid]: true },
        }
      });
    } else {
      fail("Need an ID for this one.");
    }
  });

  it("transitions from in_use to not in_use", () => {
    pending();
  });
});