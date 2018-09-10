import { ResourceUpdate, TaggedPoint } from "farmbot";
import { DropDownItem } from "../../../ui";
import { ResourceIndex } from "../../../resources/interfaces";
import { findToolById, findByKindAndId } from "../../../resources/selectors";
import { point2ddi } from "../tile_move_absolute/format_selected_dropdown";
import { capitalize } from "lodash";
import { MOUNTED_TO } from "./action_list";

export interface InputData { step: ResourceUpdate; resourceIndex: ResourceIndex; }
interface OutputData { resource: DropDownItem; action: DropDownItem; }

const TOOL_MOUNT: DropDownItem = { label: "Tool Mount", value: "tool_mount" };
const NOT_IN_USE: DropDownItem = { label: "Not Mounted", value: 0 };
const DISMOUNTED: OutputData = { resource: TOOL_MOUNT, action: NOT_IN_USE };
const DEFAULT_TOOL_NAME = "Untitled Tool";
const REMOVED_ACTION = { label: "Removed", value: "removed" };

const mountedTo = (name = DEFAULT_TOOL_NAME): DropDownItem =>
  ({ label: `${MOUNTED_TO} ${name}`, value: "mounted" });

function mountTool(i: InputData): OutputData {
  const { value } = i.step.args;
  if (typeof value === "number" && value > 0) {
    try { // Good tool id
      const tool = findToolById(i.resourceIndex, value as number);
      return { resource: TOOL_MOUNT, action: mountedTo(tool.body.name) };
    } catch { // Bad tool ID or app still loading.
      return { resource: TOOL_MOUNT, action: mountedTo("an unknown tool") };
    }
  } else {
    // No tool id
    return DISMOUNTED;
  }
}

function unknownOption(i: InputData): OutputData {
  const { resource_type, resource_id, label, value } = i.step.args;

  return {
    resource: { label: resource_type, value: resource_id },
    action: { label: `${label} = ${value}`, value: "" + value }
  };
}

function discardPoint(i: InputData): OutputData {
  const { resource_type, resource_id } = i.step.args;

  return {
    resource: point2ddi(i.resourceIndex, {
      pointer_type: resource_type,
      pointer_id: resource_id
    }),
    action: REMOVED_ACTION
  };
}

function plantStage(i: InputData): OutputData {
  const { resource_id, value } = i.step.args;
  const r: TaggedPoint = findByKindAndId(i.resourceIndex, "Point", resource_id);

  return {
    resource: { label: r.body.name, value: r.uuid },
    action: { label: capitalize("" + value), value: ("" + value) }
  };
}

export function unpackStep(i: InputData): OutputData {
  const { label } = i.step.args;

  switch (label) {
    case "mounted_tool_id": return mountTool(i);
    case "discarded_at": return discardPoint(i);
    case "plant_stage": return plantStage(i);
    default: return unknownOption(i);
  }
}
