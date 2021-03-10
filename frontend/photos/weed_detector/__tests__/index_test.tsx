const mockDeletePoints = jest.fn();
jest.mock("../../../api/delete_points", () => ({
  deletePoints: mockDeletePoints,
}));

const mockScanImage = jest.fn();
jest.mock("../actions", () => ({
  scanImage: jest.fn(() => mockScanImage),
  detectPlants: jest.fn(() => jest.fn()),
}));

import React from "react";
import { mount, shallow } from "enzyme";
import { WeedDetector } from "../index";
import { API } from "../../../api";
import { clickButton } from "../../../__test_support__/helpers";
import { fakeTimeSettings } from "../../../__test_support__/fake_time_settings";
import { detectPlants, scanImage } from "../actions";
import { deletePoints } from "../../../api/delete_points";
import { error } from "../../../toast/toast";
import { Content, ToolTips } from "../../../constants";
import { WeedDetectorProps } from "../interfaces";

describe("<WeedDetector />", () => {
  API.setBaseUrl("http://localhost:3000");

  const fakeProps = (): WeedDetectorProps => ({
    timeSettings: fakeTimeSettings(),
    botToMqttStatus: "up",
    wDEnv: {},
    env: {},
    dispatch: jest.fn(),
    currentImage: undefined,
    images: [],
    syncStatus: "synced",
    saveFarmwareEnv: jest.fn(),
  });

  it("renders", () => {
    const wrapper = mount(<WeedDetector {...fakeProps()} />);
    ["Color Range",
      "HUE01793090",
      "SATURATION025550255",
      "VALUE025550255",
      "Processing Parameters",
      "Scan current image",
    ].map(string =>
      expect(wrapper.text()).toContain(string));
  });

  it("executes plant detection", () => {
    const p = fakeProps();
    p.dispatch = jest.fn(x => x());
    const wrapper = shallow(<WeedDetector {...p} />);
    const btn = wrapper.find("button").first();
    expect(btn.props().title).not.toEqual(Content.NO_CAMERA_SELECTED);
    clickButton(wrapper, 0, "detect weeds");
    expect(detectPlants).toHaveBeenCalledWith(0);
    expect(error).not.toHaveBeenCalled();
  });

  it("shows detection button as disabled when camera is disabled", () => {
    const p = fakeProps();
    p.env = { camera: "NONE" };
    const wrapper = shallow(<WeedDetector {...p} />);
    const btn = wrapper.find("button").first();
    expect(btn.props().title).toEqual(Content.NO_CAMERA_SELECTED);
    btn.simulate("click");
    expect(error).toHaveBeenCalledWith(
      ToolTips.SELECT_A_CAMERA, { title: Content.NO_CAMERA_SELECTED });
    expect(detectPlants).not.toHaveBeenCalled();
  });

  it("executes clear weeds", () => {
    const wrapper = shallow<WeedDetector>(<WeedDetector {...fakeProps()} />);
    expect(wrapper.instance().state.deletionProgress).toBeUndefined();
    clickButton(wrapper, 1, "clear weeds");
    expect(deletePoints).toHaveBeenCalledWith(
      "weeds", { meta: { created_by: "plant-detection" } }, expect.any(Function));
    expect(wrapper.instance().state.deletionProgress).toEqual("Deleting...");
    const fakeProgress = { completed: 50, total: 100, isDone: false };
    mockDeletePoints.mock.calls[0][2](fakeProgress);
    expect(wrapper.instance().state.deletionProgress).toEqual("50 %");
    fakeProgress.isDone = true;
    mockDeletePoints.mock.calls[0][2](fakeProgress);
    expect(wrapper.instance().state.deletionProgress).toEqual("");
  });

  it("saves ImageWorkspace changes: API", () => {
    const p = fakeProps();
    const wrapper = shallow(<WeedDetector {...p} />);
    wrapper.find("ImageWorkspace").simulate("change", "H_LO", 3);
    expect(p.saveFarmwareEnv)
      .toHaveBeenCalledWith("WEED_DETECTOR_H_LO", "3");
  });

  it("calls scanImage", () => {
    const wrapper = shallow(<WeedDetector {...fakeProps()} />);
    wrapper.find("ImageWorkspace").simulate("processPhoto", 1);
    expect(scanImage).toHaveBeenCalledWith(0);
    expect(mockScanImage).toHaveBeenCalledWith(1);
  });

  it("calls scanImage with calibration", () => {
    const p = fakeProps();
    p.wDEnv.CAMERA_CALIBRATION_coord_scale = 0.5;
    const wrapper = shallow(<WeedDetector {...p} />);
    wrapper.find("ImageWorkspace").simulate("processPhoto", 1);
    expect(scanImage).toHaveBeenCalledWith(0.5);
    expect(mockScanImage).toHaveBeenCalledWith(1);
  });
});
