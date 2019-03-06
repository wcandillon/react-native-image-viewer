import React, { Component } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { DangerZone, GestureHandler } from "expo";
import {
  dragDiff, friction, bouncyPinch, bouncy,
} from "./AnimationHelpers";

const { width, height } = Dimensions.get("window");
const { Animated } = DangerZone;
const { PanGestureHandler, State, PinchGestureHandler } = GestureHandler;

const {
  set,
  cond,
  eq,
  or,
  add,
  sub,
  max,
  multiply,
  divide,
  lessThan,
  Value,
  event,
  block,
  call,
  debug,
} = Animated;

const WIDTH = width;
const HEIGHT = height;

interface ImageViewerProps {

}

export default class ImageViewer extends Component<ImageViewerProps> {
  pinchRef = React.createRef();

  panRef = React.createRef();

  constructor(props: ImageViewerProps) {
    super(props);

    // DECLARE TRANSX
    const panTransX = new Value(0);
    const panTransY = new Value(0);
    this.panTransX = panTransX;

    // PINCH
    const pinchScale = new Value(1);
    const pinchFocalX = new Value(0);
    const pinchFocalY = new Value(0);
    const pinchState = new Value(-1);

    this._onPinchEvent = event([
      {
        nativeEvent: {
          state: pinchState,
          scale: pinchScale,
          focalX: pinchFocalX,
          focalY: pinchFocalY,
        },
      },
    ]);

    // SCALE
    const scale = new Value(1);
    const pinchActive = eq(pinchState, State.ACTIVE);
    this._focalDisplacementX = new Value(0);
    const relativeFocalX = sub(
      pinchFocalX,
      add(panTransX, this._focalDisplacementX),
    );
    this._focalDisplacementY = new Value(0);
    const relativeFocalY = sub(
      pinchFocalY,
      add(panTransY, this._focalDisplacementY),
    );
    this._scale = set(
      scale,
      bouncyPinch(
        scale,
        pinchScale,
        pinchActive,
        relativeFocalX,
        this._focalDisplacementX,
        relativeFocalY,
        this._focalDisplacementY,
      ),
    );

    // PAN
    const dragX = new Value(0);
    const dragY = new Value(0);
    const panState = new Value(-1);
    this._onPanEvent = event([
      {
        nativeEvent: {
          translationX: dragX,
          translationY: dragY,
          state: panState,
        },
      },
    ]);

    const panActive = eq(panState, State.ACTIVE);
    const panFriction = value => friction(value);

    // X
    const panUpX = cond(
      lessThan(this._scale, 1),
      0,
      multiply(-1, this._focalDisplacementX),
    );
    const panLowX = add(panUpX, multiply(-WIDTH, add(max(1, this._scale), -1)));
    this.panLowX = panLowX;
    this.panUpX = panUpX;
    this._panTransX = set(
      panTransX,
      bouncy(
        panTransX,
        dragDiff(dragX, panActive),
        or(panActive, pinchActive),
        panLowX,
        panUpX,
        panFriction,
        this.props.isOutBoundX,
      ),
    );

    // Y
    const panUpY = cond(
      lessThan(this._scale, 1),
      0,
      multiply(-1, this._focalDisplacementY),
    );
    const panLowY = add(
      panUpY,
      multiply(-HEIGHT, add(max(1, this._scale), -1)),
    );
    this._panTransY = set(
      panTransY,
      bouncy(
        panTransY,
        dragDiff(dragY, panActive),
        or(panActive, pinchActive),
        panLowY,
        panUpY,
        panFriction,
      ),
    );
  }

  render() {
    const { source, scrollRef } = this.props;
    // The below two animated values makes it so that scale appears to be done
    // from the top left corner of the image view instead of its center. This
    // is required for the "scale focal point" math to work correctly
    const scaleTopLeftFixX = divide(multiply(WIDTH, add(this._scale, -1)), 2);
    const scaleTopLeftFixY = divide(multiply(HEIGHT, add(this._scale, -1)), 2);
    return (
      <Animated.View style={styles.wrapper}>
        <PinchGestureHandler
          ref={this.pinchRef}
          simultaneousHandlers={[this.panRef, scrollRef]}
          onGestureEvent={this._onPinchEvent}
          onHandlerStateChange={this._onPinchEvent}
        >
          <Animated.View>
            <PanGestureHandler
              ref={this.panRef}
              avgTouches
              simultaneousHandlers={[this.pinchRef, scrollRef]}
              onGestureEvent={this._onPanEvent}
              onHandlerStateChange={this._onPanEvent}
            >
              <Animated.Image
                style={{
                  width,
                  height: width * (source.height / source.width),
                  transform: [
                    { translateX: this._panTransX },
                    { translateY: this._panTransY },
                    { translateX: this._focalDisplacementX },
                    { translateY: this._focalDisplacementY },
                    { translateX: scaleTopLeftFixX },
                    { translateY: scaleTopLeftFixY },
                    { scale: this._scale },
                  ],
                }}
                resizeMode="contain"
                source={source}
              />
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    );
  }
}

const black = "black";
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: black,
    overflow: "hidden",
    justifyContent: "center",
  },
});
