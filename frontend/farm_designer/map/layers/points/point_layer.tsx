import React from "react";
import { TaggedGenericPointer, TaggedPoint } from "farmbot";
import { GardenPoint } from "./garden_point";
import { MapTransformProps } from "../../interfaces";
import { CameraCalibrationData, DesignerState } from "../../../interfaces";

export interface PointLayerProps {
  visible: boolean;
  genericPoints: TaggedGenericPointer[];
  mapTransformProps: MapTransformProps;
  dispatch: Function;
  interactions: boolean;
  cameraCalibrationData: CameraCalibrationData;
  cropPhotos: boolean;
  designer: DesignerState;
}

export function PointLayer(props: PointLayerProps) {
  const { visible, genericPoints, mapTransformProps, designer } = props;
  const { cameraViewGridId, hoveredPoint, gridIds, soilHeightLabels } = designer;
  const { min, max } = heightLabelRange(genericPoints);
  const style: React.CSSProperties =
    props.interactions ? {} : { pointerEvents: "none" };
  return <g id={"point-layer"} style={style}>
    {visible &&
      genericPoints.filter(p => !p.body.meta.gridId
        || gridIds.length == 0
        || !gridIds.includes(p.body.meta.gridId))
        .map(p =>
          <GardenPoint
            point={p}
            key={p.uuid}
            hovered={hoveredPoint == p.uuid}
            cameraViewGridId={cameraViewGridId}
            cameraCalibrationData={props.cameraCalibrationData}
            cropPhotos={props.cropPhotos}
            dispatch={props.dispatch}
            soilHeightLabels={soilHeightLabels}
            soilHeightRange={{ min, max }}
            mapTransformProps={mapTransformProps} />)}
  </g>;
}

const heightLabelRange = (genericPoints: TaggedPoint[]) => {
  const soilHeights = genericPoints
    .filter(p => p.body.meta.created_by == "measure-soil-height")
    .map(p => p.body.z);
  return { min: Math.min(...soilHeights), max: Math.max(...soilHeights) };
};
